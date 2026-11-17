"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowRight, Bot, Loader2, Send, ShieldCheck } from "lucide-react";
import type { TutorTopic } from "@/lib/ai-tutor";

const lessonPrompts: Record<TutorTopic, string> = {
  "trust-boundaries": "为什么外部网页里的文字不能变成 AI 的系统指令？请举例说明。",
  "least-privilege": "AI 只拥有最小权限是什么意思？请用发送邮件的例子解释。",
  "external-content": "怎样判断外部资料是否藏有提示词注入？给我三个实用方法。",
  "audit-and-confirm": "AI 调用工具前为什么需要确认和审计？请给出一个操作示例。",
};

type TutorResult = {
  answer?: string;
  message?: string;
  usage?: { inputTokens?: number; outputTokens?: number; estimatedPeakCny?: number | null } | null;
};

/** 学习地图与微课共用的轻量实时问答；复用 /api/ai-tutor 的登录、预算和密钥保护。 */
export function AiTutor({ topic }: { topic?: TutorTopic }) {
  const [question, setQuestion] = useState(
    topic ? lessonPrompts[topic] : "提示词注入是什么？请举一个生活中的例子。",
  );
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [usage, setUsage] = useState<TutorResult["usage"]>(null);

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = question.trim();
    if (busy || input.length < 4 || input.length > 600) return;
    setBusy(true);
    setAnswer("");
    setError("");
    setNeedsLogin(false);
    setUsage(null);
    try {
      const response = await fetch("/api/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input }),
      });
      const data = (await response.json().catch(() => ({}))) as TutorResult;
      if (!response.ok) {
        setNeedsLogin(response.status === 401);
        throw new Error(typeof data.message === "string" ? data.message : "暂时无法获取回答，请稍后重试。");
      }
      if (typeof data.answer !== "string" || !data.answer.trim()) {
        throw new Error("模型没有返回文字回答，可以换一种问法。");
      }
      setAnswer(data.answer);
      setUsage(data.usage ?? null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "网络请求失败，请稍后重试。");
    } finally {
      setBusy(false);
    }
  }

  return <section className="aga-tutor" aria-label="DeepSeek 实时 AI 安全助教">
    <div className="aga-tutor-header">
      <span className="aga-tutor-icon"><Bot size={23} aria-hidden="true" /></span>
      <div className="aga-tutor-heading">
        <span className="ag-overline">LIVE AI · DEEPSEEK FLASH</span>
        <h2>有不明白的地方？直接问 AI 助教。</h2>
        <p>真实调用低成本 Flash 模型。登录后可以提问，答案仅供学习参考。</p>
      </div>
      <Link href="/ai-tutor" className="aga-tutor-full">进入完整对话 <ArrowRight size={15} aria-hidden="true" /></Link>
    </div>
    <form className="aga-tutor-form" onSubmit={ask}>
      <label htmlFor={topic ? `aga-tutor-${topic}` : "aga-tutor-overview"}>想让 AI 解释什么？</label>
      <textarea
        id={topic ? `aga-tutor-${topic}` : "aga-tutor-overview"}
        value={question}
        onChange={event => setQuestion(event.target.value)}
        minLength={4}
        maxLength={600}
        rows={2}
        disabled={busy}
        required
        placeholder="写下你想了解的 AI 安全问题…"
      />
      <div className="aga-tutor-form-foot">
        <span><ShieldCheck size={15} aria-hidden="true" /> 不执行外部工具 · 每次提问计入今日额度 · 请勿填写敏感信息</span>
        <button className="ag-button ag-button-primary" type="submit" disabled={busy || question.trim().length < 4}>
          {busy ? <Loader2 size={16} className="aga-tutor-spin" aria-hidden="true" /> : <Send size={16} aria-hidden="true" />}
          {busy ? "AI 正在回答…" : "向 AI 提问"}
        </button>
      </div>
    </form>
    {error && <div className="aga-tutor-error" role="alert">{error}{needsLogin && <> <Link href="/login">前往登录</Link></>}</div>}
    {answer && <div className="aga-tutor-answer" aria-live="polite">
      <strong>AI 助教的回答</strong>
      <p>{answer}</p>
      {usage && <small>本次用量：输入 {usage.inputTokens ?? "?"} / 输出 {usage.outputTokens ?? "?"} tokens
        {typeof usage.estimatedPeakCny === "number" ? ` · 高峰时段费用估算 ¥${usage.estimatedPeakCny.toFixed(5)}` : ""}（以平台账单为准）</small>}
    </div>}
  </section>;
}
