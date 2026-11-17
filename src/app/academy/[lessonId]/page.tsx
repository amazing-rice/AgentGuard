import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { academyLessons, isAcademyLessonId } from "@/data/academy";
import { AcademyLessonRunner } from "@/components/academy/AcademyLessonRunner";

export function generateStaticParams() { return Object.keys(academyLessons).map(lessonId => ({ lessonId })); }

export default async function AcademyLessonPage({ params }: { params: Promise<{ lessonId: string }> }) {
  const { lessonId } = await params;
  if (!isAcademyLessonId(lessonId)) notFound();
  return <PublicShell><AcademyLessonRunner lesson={academyLessons[lessonId]}/></PublicShell>;
}
