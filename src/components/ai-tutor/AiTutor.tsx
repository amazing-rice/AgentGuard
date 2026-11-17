"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { ArrowRight, Bot, CircleAlert, GraduationCap, Loader2, Send, ShieldCheck, Sparkles, Wallet } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string };
type Usage = { inputTokens: number; outputTokens: number; estimatedPeakCny: number | null };
type Status = { loginRequired: boolean; enabled: boolean; configured: boolean; model: string; usedToday?: number; dailyLimit?: number; remainingToday?: number };
const samples = [
  "提示词注入是什么？请举一个旅游攻略的例子。",
  "为什么网页写着‘系统指令’也不能要求 AI 导出文件？",
  "根据我的学习成绩，推荐我下一步学什么。",
  "AI 要发送邮件前，如何判断是否需要我确认？",
];

export function AiTutor() {
  const [status, setStatus] = useState<Status | null>(null);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const answerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let valid = true;
    fetch("/api/ai-tutor", { cache: "no-store" })
      .then(response => { if (!response.ok) throw new Error("获取用量失败"); return response.json(); })
      .then((value: Status) => { if (valid) setStatus(value); })
      .catch(() => { if (valid) setError("暂时无法读取用量，请检查数据库迁移。 "); });
    return () => { valid = false; };
  }, []);

  useEffect(() => { if (messages.length) answerRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }); }, [messages.length]);

  async function ask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = question.trim();
    if (busy || value.length < 4 || value.length > 600) return;
    const previous = messages;
    const newQuestion: Message = { role: "user", content: value };
    setMessages(current => [...current, newQuestion]);
    setQuestion("");
    setBusy(true);
    setError("");
    setUsage(null);
    try {
      const response = await fetch("/api/ai-tutor", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: value, history: previous.slice(-4).map(item => ({ role: item.role, content: item.content.slice(0, 600) })) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "本次回答失败，请稍后重试。");
      setMessages(current => [...current, { role: "assistant", content: data.answer }]);
      setUsage(data.usage ?? null);
      setStatus(current => current && !current.loginRequired ? {
        ...current, usedToday: (current.usedToday ?? 0) + 1,
        remainingToday: Math.max(0, (current.remainingToday ?? 0) - 1),
      } : current);
    } catch (reason) {
      setMessages(previous);
      setQuestion(value);
      setError(reason instanceof Error ? reason.message : "模型请求失败。");
      // 失败请求也可能消耗配额；主动刷新准确次数。
      fetch("/api/ai-tutor", { cache: "no-store" }).then(response => response.json()).then(setStatus).catch(() => {});
    } finally { setBusy(false); }
  }

  return <div className="agt-root">
    <section className="agt-hero"><div className="ag-wrap agt-hero-content"><div><span className="ag-overline">AGENTGUARD · LIVE AI TUTOR</span><h1>遇到 AI 安全问题？<br/><span>问问你的 AI 学习搭子。</span></h1><p>真实调用 DeepSeek Flash，解释安全概念、帮你复盘题目，还能结合已经保存的课程成绩推荐下一步学习内容。</p><div className="agt-tags"><span><Bot size={16}/> 真实 AI 回答</span><span><Wallet size={16}/> Flash 低成本模式</span><span><ShieldCheck size={16}/> 不执行外部工具</span></div></div><div className="agt-hero-icon" aria-hidden="true"><span>🤖</span><strong>AI STUDY<br/>BUDDY</strong></div></div></section>
    <section className="ag-wrap agt-body">
      <div className="agt-info-bar"><div><Sparkles size={19}/><span>模型：<strong>deepseek-flash</strong> · 非思考模式 · 不联网搜索</span></div><span>{status?.loginRequired ? "登录后即可使用" : status?.enabled === false ? "暂未开放" : status?.configured === false ? "等待管理员配置 API Key" : status?.remainingToday !== undefined ? `今天剩余 ${status.remainingToday} / ${status.dailyLimit} 次` : "检查使用状态中…"}</span></div>
      <div className="agt-layout"><div className="agt-chat" aria-label="AI 助教对话">
        <div className="agt-chat-title"><span className="agt-avatar"><Bot size={23}/></span><div><strong>AgentGuard AI 安全助教</strong><small>真实模型 · 教学建议仅供学习参考</small></div><span className="agt-live">LIVE API</span></div>
        <div className="agt-messages" aria-live="polite"><div className="agt-message agt-assistant"><span className="agt-message-icon">🤖</span><p>欢迎来学习 AI 安全！你可以问我提示词注入、最小权限、工具调用审计等问题。也可以让我根据课程最高分给出复习建议。<br/>请不要输入真实密码、API Key 或其他敏感资料。</p></div>
          {messages.map((message, index) => <div className={`agt-message ${message.role === "assistant" ? "agt-assistant" : "agt-user"}`} key={index}><span className="agt-message-icon">{message.role === "assistant" ? "🤖" : "🙋"}</span><p>{message.content}</p></div>)}
          {busy && <div className="agt-message agt-assistant"><span className="agt-message-icon">🤖</span><p className="agt-loading"><Loader2 size={17} className="agt-spin"/> 正在调用 DeepSeek Flash…</p></div>}
          <div ref={answerRef}/>
        </div>
        {usage && <div className="agt-usage"><Wallet size={16}/><span>本轮实际用量：输入 {usage.inputTokens} / 输出 {usage.outputTokens} tokens</span><strong>{usage.estimatedPeakCny !== null ? `高峰价估算 ≤ ¥${usage.estimatedPeakCny.toFixed(5)}` : "费用待控制台确认"}</strong></div>}
        {error && <div role="alert" className="agt-error"><CircleAlert size={18}/>{error}</div>}
        {status?.loginRequired && <div className="agt-login-warning"><span>为了限制接口费用，AI 助教仅对登录用户开放。</span><Link href="/login">去登录 <ArrowRight size={14}/></Link></div>}
        <form onSubmit={ask} className="agt-form"><label htmlFor="agt-question">向助教提问</label><textarea id="agt-question" rows={3} maxLength={600} value={question} placeholder="例如：为什么 AI 不能服从网页里的‘系统通知’？" onChange={event => setQuestion(event.target.value)} disabled={busy || status?.loginRequired || status?.enabled === false || status?.configured === false}/><div><span>{question.length} / 600 字 · 请勿输入隐私信息</span><button className="ag-button ag-button-primary" type="submit" disabled={busy || question.trim().length < 4 || status?.loginRequired || status?.enabled === false || status?.configured === false}>{busy ? <Loader2 size={17} className="agt-spin"/> : <Send size={17}/>} 提交问题</button></div></form>
      </div>
      <aside className="agt-sidebar"><div className="agt-side-panel"><div className="agt-side-title"><GraduationCap size={21}/><h2>从这些问题开始</h2></div><p>点一下就能把题目填入输入框，再由你确认发送。</p><div className="agt-samples">{samples.map(item => <button type="button" key={item} disabled={busy} onClick={() => setQuestion(item)}>{item}<ArrowRight size={15}/></button>)}</div></div><div className="agt-side-panel agt-side-note"><ShieldCheck size={23}/><h3>真实 AI，但有清晰边界</h3><p>此处没有文件读写、邮件发送或联网工具权限。AI 只给出文字建议；真正的越权操作实验仍在工作坊的虚构沙箱中进行。</p><Link href="/workshop">前往 AI 安全工作坊 <ArrowRight size={15}/></Link></div><div className="agt-side-panel agt-side-cost"><Wallet size={22}/><h3>怎么控制使用成本？</h3><p>每次最多生成 700 tokens。本站同时限制每位用户和全站每日请求量。根据你的价格表，按高峰价估算，输入 1000 tokens、输出 500 tokens 约 ¥0.006。</p><small>不包含搜索、抓取等额外服务；费用仅为估算，请以 DeepSeek 控制台为准。对话内容不保存在本地数据库。</small></div></aside></div>
    </section>
  </div>;
}
