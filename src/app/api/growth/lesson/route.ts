import { z } from "zod";
import { getCurrentUser, isSameOriginRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { INTRO_LESSON_ID, lessonCases, scoreLesson } from "@/data/growth";
import { academyLessons, isAcademyLessonId, scoreAcademyLesson } from "@/data/academy";

const inputSchema = z.object({
  lessonId: z.string().min(1).max(64),
  answers: z.array(z.union([z.boolean(), z.string().max(32)])).min(1).max(10),
}).strict();

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: "ORIGIN_MISMATCH" }, { status: 403 });
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "LOGIN_REQUIRED", message: "登录后可同步学习记录" }, { status: 401 });
  const input: unknown = await request.json().catch(() => null);
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) return Response.json({ error: "INVALID_ANSWERS" }, { status: 400 });

  const { lessonId, answers } = parsed.data;
  let score: { correct: number; total: number; passed: boolean };
  if (lessonId === INTRO_LESSON_ID) {
    if (answers.length !== lessonCases.length || !answers.every((answer): answer is boolean => typeof answer === "boolean")) {
      return Response.json({ error: "INVALID_ANSWERS" }, { status: 400 });
    }
    score = scoreLesson(answers);
  } else if (isAcademyLessonId(lessonId)) {
    const lesson = academyLessons[lessonId];
    if (answers.length !== lesson.questions.length || !answers.every((answer): answer is string => typeof answer === "string")) {
      return Response.json({ error: "INVALID_ANSWERS" }, { status: 400 });
    }
    try { score = scoreAcademyLesson(lessonId, answers); }
    catch { return Response.json({ error: "INVALID_ANSWERS" }, { status: 400 }); }
  } else {
    return Response.json({ error: "UNKNOWN_LESSON" }, { status: 400 });
  }

  const previous = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    select: { bestScore: true },
  });
  const record = await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, lastScore: score.correct, bestScore: score.correct, attempts: 1 },
    update: { lastScore: score.correct, bestScore: Math.max(previous?.bestScore ?? 0, score.correct), attempts: { increment: 1 }, completedAt: new Date() },
    select: { bestScore: true, lastScore: true, attempts: true, updatedAt: true },
  });
  return Response.json({ saved: true, score, progress: record }, { headers: { "Cache-Control": "private, no-store" } });
}
