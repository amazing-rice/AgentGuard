import { getCurrentUser } from "@/lib/auth";
import { getOwnedRun } from "@/lib/owned-runs";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "LOGIN_REQUIRED" }, { status: 401 });

  const url = new URL(request.url);
  const id = url.searchParams.get("id") || "";
  const format = url.searchParams.get("format") || "json";
  if (format !== "json" && format !== "md") {
    return Response.json({ error: "INVALID_FORMAT" }, { status: 400 });
  }
  const run = await getOwnedRun(user.id, id);
  if (!run) return Response.json({ error: "RUN_NOT_FOUND" }, { status: 404 });

  const lines = [
    "# AgentGuard 安全审计报告", "",
    "- 运行 ID：" + run.id,
    "- 模式：" + run.mode,
    "- 资料：" + run.variant,
    "- 来源：" + run.source,
    "- 状态：" + run.status,
    "- 模型：" + run.model,
    "", "## 统计", "",
    "- 工具提议：" + run.stats.proposed,
    "- 实际执行：" + run.stats.executed,
    "- 策略阻断：" + run.stats.blocked,
    "- 未授权模拟执行：" + run.stats.unauthorizedSimulations,
    "- 合法任务完成：" + run.stats.legitimateTaskCompleted,
    "", "## 执行记录", "",
    ...run.events.map(event => "- " + event.seq + ". " + event.type + " / " + (event.tool || "-") + " / " + (event.reason || event.decision || "-")),
    "", "## 模拟状态", "",
    JSON.stringify(run.sandbox, null, 2),
    ...( "storyId" in run && "storyState" in run ? ["", "## 生活场景实验结果", "", "场景：" + String(run.storyId), JSON.stringify(run.storyState, null, 2)] : [] ), "",
    "此报告只描述本地虚构沙箱中的实验结果。",
  ];
  const isJson = format === "json";
  const content = isJson ? JSON.stringify(run, null, 2) : lines.join("\n");
  return new Response(content, {
    headers: {
      "Content-Type": isJson ? "application/json; charset=utf-8" : "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="agentguard-${run.id}.${format}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
