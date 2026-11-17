import { z } from "zod";
import { getCurrentUser, isSameOriginRequest } from "@/lib/auth";
import { saveOwnedRun } from "@/lib/owned-runs";
import { STORY_IDS } from "@/data/storyLab";
import { fixtureStoryExperiment, liveStoryExperiment } from "@/lib/story-engine";

const requestSchema = z.object({
  storyId: z.enum(STORY_IDS),
  mode: z.enum(["baseline", "guarded"]),
  variant: z.enum(["clean", "injected"]),
  source: z.enum(["fixture", "live"]),
}).strict();

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "ORIGIN_MISMATCH" }, { status: 403 });
  const json: unknown = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(json);
  if (!parsed.success) return Response.json({ error: "INVALID_REQUEST" }, { status: 400 });
  const { storyId, mode, variant, source } = parsed.data;
  const user = await getCurrentUser();
  if (source === "live" && !user) return Response.json({ error: "LOGIN_REQUIRED" }, { status: 401 });
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (source === "live" && !apiKey) return Response.json({ error: "MODEL_NOT_CONFIGURED" }, { status: 503 });
  const run = source === "fixture" ? fixtureStoryExperiment(storyId, mode, variant) : await liveStoryExperiment(storyId, mode, variant, apiKey!);
  if (user) {
    try { await saveOwnedRun(user.id, run); }
    catch { return Response.json({ error: "SAVE_FAILED", message: "本次实验已执行，但数据库保存失败" }, { status: 500 }); }
  }
  return Response.json({ ...run, savedToAccount: Boolean(user) }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
