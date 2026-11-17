import { AI_RESPONSE_ORIGIN_NOTE } from "@/lib/tutor-origin";
import { z } from "zod";
import { getCurrentUser, isSameOriginRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TUTOR_CONTEXT_KEYS, tutorContextSystemNote } from "@/lib/tutor-context";
import { AI_TUTOR_MODEL, AI_TUTOR_MAX_OUTPUT_TOKENS, AI_TUTOR_MAX_QUESTION_CHARS, buildTutorSystemPrompt, estimatePeakCny, readLimit, type TutorUsage } from "@/lib/ai-tutor";

export const runtime = "nodejs";

const inputSchema = z.object({
  question: z.string().trim().min(4).max(AI_TUTOR_MAX_QUESTION_CHARS),
  context: z.enum(TUTOR_CONTEXT_KEYS).default("general"),
  history: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().trim().min(1).max(600),
  }).strict()).max(4).default([]),
}).strict();

const noStore = { "Cache-Control": "private, no-store" };
const DAY_USER_DEFAULT = 12;
const DAY_GLOBAL_DEFAULT = 120;

class BudgetError extends Error {
  constructor(public readonly kind: "user" | "global") { super("BUDGET_EXHAUSTED"); }
}

function config() {
  return {
    perUser: readLimit(process.env.AI_TUTOR_USER_DAILY_LIMIT, DAY_USER_DEFAULT, 30),
    global: readLimit(process.env.AI_TUTOR_GLOBAL_DAILY_LIMIT, DAY_GLOBAL_DEFAULT, 500),
    enabled: process.env.AI_TUTOR_ENABLED !== "false",
  };
}

function utcDay(): string { return new Date().toISOString().slice(0, 10); }
function quotaKeys(userId: string, day: string) {
  return [{ id: `user:${userId}:${day}`, kind: "user" as const }, { id: `global:${day}`, kind: "global" as const }];
}

async function reserveCall(userId: string, day: string, perUser: number, global: number) {
  const keys = quotaKeys(userId, day);
  await prisma.$transaction(async tx => {
    for (const item of keys) {
      await tx.aiTutorDailyQuota.upsert({ where: { id: item.id }, create: { id: item.id, day }, update: {} });
      const allowed = await tx.aiTutorDailyQuota.updateMany({
        where: { id: item.id, requests: { lt: item.kind === "user" ? perUser : global } },
        data: { requests: { increment: 1 } },
      });
      if (!allowed.count) throw new BudgetError(item.kind);
    }
  });
}

async function recordTokens(userId: string, day: string, usage?: TutorUsage) {
  if (!usage) return;
  const input = Math.max(0, Math.floor(usage.prompt_tokens ?? 0));
  const output = Math.max(0, Math.floor(usage.completion_tokens ?? 0));
  if (!Number.isSafeInteger(input) || !Number.isSafeInteger(output)) return;
  try {
    await prisma.$transaction(quotaKeys(userId, day).map(item =>
      prisma.aiTutorDailyQuota.update({
        where: { id: item.id },
        data: { inputTokens: { increment: input }, outputTokens: { increment: output } },
      })
    ));
  } catch {
    // 服务端配额次数已经被保留；计量统计失败不应泄漏模型回答或重复调用。
  }
}

export async function GET() {
  const user = await getCurrentUser();
  const { perUser, enabled } = config();
  if (!user) return Response.json({ loginRequired: true, model: AI_TUTOR_MODEL, enabled, configured: Boolean(process.env.DEEPSEEK_API_KEY) }, { headers: noStore });
  const today = utcDay();
  const quota = await prisma.aiTutorDailyQuota.findUnique({ where: { id: `user:${user.id}:${today}` } });
  return Response.json({ loginRequired: false, enabled, configured: Boolean(process.env.DEEPSEEK_API_KEY), model: AI_TUTOR_MODEL,
    usedToday: quota?.requests ?? 0, dailyLimit: perUser, remainingToday: Math.max(0, perUser - (quota?.requests ?? 0)) },
    { headers: noStore });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "ORIGIN_MISMATCH" }, { status: 403, headers: noStore });
  if (Number(request.headers.get("content-length") || 0) > 5000) return Response.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413, headers: noStore });
  const raw = await request.text().catch(() => "");
  if (raw.length > 5000) return Response.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413, headers: noStore });
  let input: unknown;
  try { input = JSON.parse(raw); } catch { input = null; }
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return Response.json({ error: "INVALID_QUESTION", message: "问题至少 4 字，最多 600 字。" }, { status: 400, headers: noStore });

  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "LOGIN_REQUIRED", message: "请先登录，再向 AI 助教提问。" }, { status: 401, headers: noStore });
  const settings = config();
  if (!settings.enabled) return Response.json({ error: "AI_DISABLED", message: "AI 助教目前暂未开放。" }, { status: 503, headers: noStore });
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return Response.json({ error: "MODEL_NOT_CONFIGURED", message: "管理员尚未配置 DeepSeek API Key。" }, { status: 503, headers: noStore });

  const day = utcDay();
  try { await reserveCall(user.id, day, settings.perUser, settings.global); }
  catch (error) {
    if (error instanceof BudgetError) return Response.json({ error: "DAILY_LIMIT_REACHED", message: error.kind === "user" ? "今日提问次数已用完，请明天再来。" : "本站今日 AI 演示总额度已用完。" }, { status: 429, headers: noStore });
    return Response.json({ error: "BUDGET_UNAVAILABLE", message: "用量记录暂时不可用，请确认已执行数据库迁移。" }, { status: 503, headers: noStore });
  }

  const progress = await prisma.lessonProgress.findMany({ where: { userId: user.id }, select: { lessonId: true, bestScore: true }, take: 10 });
  const history = parsed.data.history;
  let upstream: Response;
  try {
    upstream = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: AI_TUTOR_MODEL,
        thinking: { type: "disabled" },
        safety_check: { level: "high" },
        messages: [
          { role: "system", content: `${buildTutorSystemPrompt(progress)}\n\n${tutorContextSystemNote(parsed.data.context)}\n\n${AI_RESPONSE_ORIGIN_NOTE}` },
          ...history,
          { role: "user", content: parsed.data.question },
        ],
        stream: false,
        max_tokens: AI_TUTOR_MAX_OUTPUT_TOKENS,
      }),
      signal: AbortSignal.timeout(30_000),
      cache: "no-store",
    });
  } catch {
    return Response.json({ error: "MODEL_UNAVAILABLE", message: "模型暂时无法连接，请稍后重试。此次尝试已计入每日调用次数。" }, { status: 503, headers: noStore });
  }
  if (!upstream.ok) {
    const message = upstream.status === 429 ? "DeepSeek 正在限流，请稍后再试。" : upstream.status === 402 ? "DeepSeek 账户余额不足，请联系站点管理员。" : "DeepSeek 暂时没有返回正常结果，请稍后再试。";
    return Response.json({ error: "MODEL_ERROR", message, providerStatus: upstream.status }, { status: 503, headers: noStore });
  }

  let payload: { choices?: { message?: { content?: string | null }; finish_reason?: string }[]; usage?: TutorUsage };
  try { payload = await upstream.json(); }
  catch { return Response.json({ error: "MODEL_RESPONSE_INVALID", message: "模型返回的数据无法解析。" }, { status: 502, headers: noStore }); }
  const content = payload.choices?.[0]?.message?.content?.trim();
  await recordTokens(user.id, day, payload.usage);
  if (!content) return Response.json({ error: "MODEL_EMPTY", message: "模型没有提供文字回答，可以换一种问法。" }, { status: 502, headers: noStore });
  const price = estimatePeakCny(payload.usage);
  return Response.json({ answer: content.slice(0, 3500), model: AI_TUTOR_MODEL, thinking: false,
    finishReason: payload.choices?.[0]?.finish_reason ?? "unknown",
    usage: payload.usage ? {
      inputTokens: payload.usage.prompt_tokens ?? 0,
      outputTokens: payload.usage.completion_tokens ?? 0,
      estimatedPeakCny: price,
    } : null,
    note: "调用真实 DeepSeek API；金额为根据当前官方高峰单价估算的上界，实际扣费请查看 DeepSeek 控制台。问题和回答不会存入本站数据库。",
  }, { headers: noStore });
}
