import { z } from "zod";
import { getCurrentUser, isSameOriginRequest } from "@/lib/auth";
import { saveOwnedRun } from "@/lib/owned-runs";
import { STORY_IDS } from "@/data/storyLab";
import { fixtureWorkshopExperiment, liveStoryExperiment } from "@/lib/story-engine";
import { WORKSHOP_DOCUMENT_MAX, WORKSHOP_DOCUMENT_MIN } from "@/lib/workshop-domain";
import type { StoryRun } from "@/lib/story-engine";

const schema = z.object({
  storyId: z.enum(STORY_IDS),
  mode: z.enum(["baseline", "guarded"]),
  source: z.enum(["fixture", "live"]),
  documentText: z.string().trim().min(WORKSHOP_DOCUMENT_MIN).max(WORKSHOP_DOCUMENT_MAX),
}).strict();

// 演示型、单进程限流。公开多实例部署需换成共享存储并设置配额。
const liveBudget = new Map<string, number[]>();
const WINDOW_MS = 10 * 60_000;
const MAX_LIVE_CALLS = 6;

function reserveLiveCall(userId: string): boolean {
  const now = Date.now();
  const recent = (liveBudget.get(userId) ?? []).filter(time => now - time < WINDOW_MS);
  if (recent.length >= MAX_LIVE_CALLS) return false;
  liveBudget.set(userId, [...recent, now]);
  return true;
}

function redactedForStorage(run: StoryRun): StoryRun {
  return {
    ...run,
    finalAnswer: "实验已执行。为保护你自定义输入的隐私，模型回复原文未保存。",
    storyState: {
      ...run.storyState,
      outputTitle: run.storyState.outputTitle ? "（自定义实验的正文不保存）" : "",
      outputLines: [],
    },
    events: run.events.map(event => {
      if (event.details === undefined) return event;
      return { ...event, details: "[自定义实验仅保留工具名称、决策和原因]" };
    }),
  };
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "ORIGIN_MISMATCH" }, { status: 403 });
  }
  const declaredSize = Number(request.headers.get("content-length") || 0);
  if (declaredSize > 8000) {
    return Response.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  }
  // Content-Length 可以缺失，读取后再次限制长度，避免无上限处理输入。
  const raw = await request.text().catch(() => "");
  if (raw.length > 8000) return Response.json({ error: "PAYLOAD_TOO_LARGE" }, { status: 413 });
  let json: unknown = null;
  try { json = JSON.parse(raw); } catch { /* INVALID_REQUEST */ }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return Response.json({ error: "INVALID_REQUEST" }, { status: 400 });
  const { storyId, mode, source, documentText } = parsed.data;
  const user = await getCurrentUser();
  if (source === "live" && !user) {
    return Response.json({ error: "LOGIN_REQUIRED" }, { status: 401 });
  }
  const key = process.env.DEEPSEEK_API_KEY;
  if (source === "live" && !key) {
    return Response.json({ error: "MODEL_NOT_CONFIGURED" }, { status: 503 });
  }
  if (source === "live" && user && !reserveLiveCall(user.id)) {
    return Response.json({ error: "MODEL_QUOTA_REACHED", message: "每个账号每 10 分钟最多 6 次实时调用。" }, { status: 429 });
  }
  const run = source === "fixture"
    ? fixtureWorkshopExperiment(storyId, mode, documentText)
    : await liveStoryExperiment(storyId, mode, "injected", key!, documentText);
  if (user) {
    try { await saveOwnedRun(user.id, redactedForStorage(run)); }
    catch { return Response.json({ error: "SAVE_FAILED", message: "实验已执行但无法保存审计结果" }, { status: 500 }); }
  }
  return Response.json({ ...run, savedToAccount: Boolean(user), documentTextStored: false }, {
    status: 201,
    headers: { "Cache-Control": "private, no-store" },
  });
}
