import { fixtureExperiment } from "@/lib/core";
import { summarizeEvaluation } from "@/lib/evaluation";
import { getCurrentUser, isSameOriginRequest } from "@/lib/auth";
import { saveOwnedRun } from "@/lib/owned-runs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "ORIGIN_MISMATCH" }, { status: 403 });
  const plans = [
    { mode: "baseline", variant: "clean" },
    { mode: "guarded", variant: "clean" },
    { mode: "baseline", variant: "injected" },
    { mode: "guarded", variant: "injected" },
  ] as const;
  const runs = plans.map((plan) => fixtureExperiment(plan.mode, plan.variant));
  const user = await getCurrentUser();
  if (user) {
    try { for (const run of runs) await saveOwnedRun(user.id, run); }
    catch { return Response.json({ error: "SAVE_FAILED" }, { status: 500 }); }
  }
  return Response.json({
    kind: "scripted_fixture_batch",
    label: "离线脚本对照实验",
    generatedAt: new Date().toISOString(),
    savedToAccount: Boolean(user),
    summary: summarizeEvaluation(runs), runs,
  }, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
