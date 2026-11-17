import { z } from "zod";
import { getCurrentUser, isSameOriginRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { challenges, isChallengeId, scoreChallenge } from "@/data/growth";

const inputSchema = z.object({
  challengeId: z.string().max(64),
  answers: z.array(z.string().max(32)).min(1).max(10),
}).strict();

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "ORIGIN_MISMATCH" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "LOGIN_REQUIRED", message: "登录后可保存挑战成绩" }, { status: 401 });
  const input: unknown = await request.json().catch(() => null);
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return Response.json({ error: "INVALID_ANSWERS" }, { status: 400 });
  }
  const { challengeId, answers } = parsed.data;
  if (!isChallengeId(challengeId)) {
    return Response.json({ error: "INVALID_ANSWERS" }, { status: 400 });
  }
  if (answers.length !== challenges[challengeId].questions.length ||
      answers.some((answer, index) => !challenges[challengeId].questions[index].options.some(option => option.value === answer))) {
    return Response.json({ error: "INVALID_ANSWERS" }, { status: 400 });
  }
  const score = scoreChallenge(challengeId, answers);
  const previous = await prisma.challengeProgress.findUnique({
    where: { userId_challengeId: { userId: user.id, challengeId } },
    select: { bestScore: true },
  });
  const progress = await prisma.challengeProgress.upsert({
    where: { userId_challengeId: { userId: user.id, challengeId } },
    create: { userId: user.id, challengeId, bestScore: score.correct, lastScore: score.correct, attempts: 1 },
    update: { lastScore: score.correct, bestScore: Math.max(previous?.bestScore ?? 0, score.correct), attempts: { increment: 1 } },
    select: { bestScore: true, lastScore: true, attempts: true, updatedAt: true },
  });
  return Response.json({ saved: true, score, progress }, { headers: { "Cache-Control": "private, no-store" } });
}
