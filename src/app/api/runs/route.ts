import { z } from "zod";
import { fixtureExperiment, liveExperiment } from "@/lib/core";
import { getCurrentUser, isSameOriginRequest } from "@/lib/auth";
import { listOwnedRuns, saveOwnedRun } from "@/lib/owned-runs";

const schema = z.object({
  mode: z.enum(["baseline", "guarded"]),
  variant: z.enum(["clean", "injected"]),
  source: z.enum(["fixture", "live"]),
}).strict();

export async function GET() {
  const user = await getCurrentUser();
  return Response.json(user ? await listOwnedRuns(user.id) : [], {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "ORIGIN_MISMATCH" }, { status: 403 });
  }
  const body: unknown = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "INVALID_REQUEST" }, { status: 400 });

  const user = await getCurrentUser();
  const { mode, variant, source } = parsed.data;
  if (source === "live" && !user) {
    return Response.json({ error: "LOGIN_REQUIRED", message: "使用实时 AI 前请先登录" }, { status: 401 });
  }
  const key = process.env.DEEPSEEK_API_KEY;
  if (source === "live" && !key) {
    return Response.json({ error: "MODEL_NOT_CONFIGURED" }, { status: 503 });
  }

  const run = source === "fixture"
    ? fixtureExperiment(mode, variant)
    : await liveExperiment(mode, variant, key!);

  if (user) {
    try { await saveOwnedRun(user.id, run); }
    catch { return Response.json({ error: "SAVE_FAILED", message: "实验已执行，但无法保存至个人记录，请检查数据库" }, { status: 500 }); }
  }
  return Response.json({ ...run, savedToAccount: Boolean(user) }, {
    status: 201,
    headers: { "Cache-Control": "private, no-store" },
  });
}
