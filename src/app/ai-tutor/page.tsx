import { PublicShell } from "@/components/public/PublicShell";
import { AiTutor } from "@/components/ai-tutor/AiTutor";

export const metadata = {
  title: "AI 安全助教 · AgentGuard",
  description: "通过 DeepSeek Flash 实时学习提示词注入、最小权限与工具调用审计，了解每次问答的 token 用量。",
};

export default function AiTutorPage() {
  return <PublicShell><AiTutor/></PublicShell>;
}
