import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import StoryLabPlay from "@/components/stories/StoryLabPlay";
import { isStoryId } from "@/data/storyLab";

export default async function StoryPlayPage({ params }: { params: Promise<{ scenarioId: string }> }) {
  const { scenarioId } = await params;
  if (!isStoryId(scenarioId)) notFound();
  return <PublicShell><StoryLabPlay id={scenarioId} /></PublicShell>;
}
