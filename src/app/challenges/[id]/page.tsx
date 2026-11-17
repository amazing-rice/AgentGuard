import { notFound } from "next/navigation";
import { PublicShell } from "@/components/public/PublicShell";
import { ChallengeRunner } from "@/components/challenges/ChallengeRunner";
import { challenges, isChallengeId } from "@/data/growth";

export default async function ChallengePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isChallengeId(id)) notFound();
  return <PublicShell><ChallengeRunner challenge={challenges[id]}/></PublicShell>;
}
