import type { Metadata } from "next";
import { Suspense } from "react";
import { SessionAwareFloatingTutor } from "@/components/ai-tutor/SessionAwareFloatingTutor";
import "./globals.css";
import "./public.css";
import "./growth.css";
import "./story-lab.css";
import "./workshop.css";
import "./academy.css";
import "./ai-tutor.css";
import "./floating-tutor.css";
import "./v271-floating-fixes.css";

export const metadata: Metadata = {
  title: "AgentGuard · AI 安全侦探社",
  description: "用生活故事、互动实验和安全体检，学习如何给 AI 助手加上安全锁。所有实验只操作虚构沙箱数据。",
};

export default function RootLayout({children}: Readonly<{children:React.ReactNode}>) {
  return <html lang="zh-CN"><body>{children}<Suspense fallback={null}><SessionAwareFloatingTutor /></Suspense></body></html>;
}
