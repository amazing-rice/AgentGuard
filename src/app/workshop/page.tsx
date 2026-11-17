import type { Metadata } from "next";
import { PublicShell } from "@/components/public/PublicShell";
import Workshop from "@/components/workshop/Workshop";

export const metadata: Metadata = {
  title: "AI 指令侦探工作坊 · AgentGuard",
  description: "亲手修改外部资料，预测 AI 的工具操作，再比较有无安全保护时的模拟结果。",
};

export default function WorkshopPage() {
  return <PublicShell><Workshop /></PublicShell>;
}
