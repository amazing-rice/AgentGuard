import type { ExperimentRun } from "@/lib/core";
import { prisma } from "@/lib/prisma";

/** 仅保存虚构沙箱运行到已登录用户。未登录体验不会进入个人数据库。 */
export async function saveOwnedRun(userId: string, run: ExperimentRun): Promise<void> {
  await prisma.experimentRecord.create({
    data: {
      runId: run.id,
      userId,
      mode: run.mode,
      variant: run.variant,
      source: run.source,
      status: run.status,
      proposed: run.stats.proposed,
      blocked: run.stats.blocked,
      completed: run.stats.legitimateTaskCompleted,
      runJson: JSON.stringify(run),
    },
  });
}

export async function listOwnedRuns(userId: string): Promise<ExperimentRun[]> {
  const records = await prisma.experimentRecord.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { runJson: true },
  });
  return records.map((record) => JSON.parse(record.runJson) as ExperimentRun);
}

export async function getOwnedRun(userId: string, runId: string): Promise<ExperimentRun | null> {
  if (!/^[0-9a-f-]{36}$/i.test(runId)) return null;
  const record = await prisma.experimentRecord.findFirst({
    where: { userId, runId },
    select: { runJson: true },
  });
  return record ? JSON.parse(record.runJson) as ExperimentRun : null;
}
