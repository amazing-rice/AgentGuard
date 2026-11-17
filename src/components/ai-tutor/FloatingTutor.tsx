"use client";

import Link from "next/link";
import { assertTutorSession, TutorSessionChangedError } from "@/lib/tutor-session";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { ArrowRight, Bot, CircleAlert, LoaderCircle, Maximize2, MessageCircle, Send, ShieldCheck, Sparkles, Trash2, Wallet, X } from "lucide-react";
import { TUTOR_CONTEXTS, tutorContextForPath } from "@/lib/tutor-context";

type ChatMessage = { role: "user" | "assistant"; content: string };
type QuotaStatus = { loginRequired?: boolean; configured?: boolean; enabled?: boolean; usedToday?: number; dailyLimit?: number; remainingToday?: number };
type Usage = { inputTokens: number; outputTokens: number; estimatedPeakCny: number | null };

async function readQuota(signal?: AbortSignal): Promise<QuotaStatus> {
  const response = await fetch("/api/ai-tutor", { cache: "no-store", signal });
  if (!response.ok) throw new Error("服务暂时不可用，请检查数据库连接及迁移状态。");
  return response.json() as Promise<QuotaStatus>;
}

/**
 * Root-mounted, lightweight tutor widget.
 * - Shares /api/ai-tutor, authentication and the existing persistent daily quotas.
 * - Keeps conversation only in this browser tab's React state (no localStorage).
 * - Sends a fixed allowlisted page category, never page contents or arbitrary URLs.
 * - No model tool execution, RAG or access to current experiment details.
 */
export function FloatingTutor({ sessionUserId }: { sessionUserId: string | null }) {
  const pathname = usePathname();
  const context = tutorContextForPath(pathname);
  const page = TUTOR_CONTEXTS[context];
  const id = useId();
  const panelLabel = `${id}-title`;
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [quota, setQuota] = useState<QuotaStatus | null>(null);
  const [error, setError] = useState("");
  const [usage, setUsage] = useState<Usage | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const restoreTriggerFocusRef = useRef(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesRef = useRef<HTMLDivElement>(null);
  const canFocusInput = Boolean(quota && !quota.loginRequired && quota.configured !== false && quota.enabled !== false);

  // A navigation through auth routes ends this in-memory chat session so a
  // different signed-in user cannot see the previous user's local transcript.
  useEffect(() => {
    if (pathname !== "/login" && pathname !== "/register") return;
    // Async transition avoids a synchronous state cascade in an effect.
    const task = window.setTimeout(() => {
      setMessages([]);
      setDraft("");
      setUsage(null);
      setQuota(null);
      setError("");
      setOpen(false);
    }, 0);
    return () => window.clearTimeout(task);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    void readQuota(controller.signal)
      .then(value => {
        if (controller.signal.aborted) return;
        setQuota(value);
        if (value.loginRequired) { setMessages([]); setUsage(null); }
      })
      .catch(() => { if (!controller.signal.aborted) setError("暂时无法读取 AI 使用状态，请稍后再试。"); });
    return () => controller.abort();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const task = window.setTimeout(() => {
      if (canFocusInput) inputRef.current?.focus();
      else closeButtonRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(task);
  }, [open, canFocusInput]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        restoreTriggerFocusRef.current = true;
        setOpen(false);
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea:not([disabled])'
      ) ?? []).filter(element => element.getClientRects().length > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const element = messagesRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [open, messages, busy, error]);

  function close() {
    restoreTriggerFocusRef.current = true;
    setOpen(false);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = draft.trim();
    if (busy || !quota || quota.loginRequired || quota.enabled === false || quota.configured === false || (quota.remainingToday !== undefined && quota.remainingToday <= 0) || value.length < 4 || value.length > 600) return;

    const earlier = [...messages];
    setMessages(previous => [...previous, { role: "user", content: value }]);
    setDraft("");
    setBusy(true);
    setError("");
    setUsage(null);
    try {
      await assertTutorSession(sessionUserId); // Verify BEFORE paid POST.
      const response = await fetch("/api/ai-tutor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: value,
          context,
          history: earlier.slice(-4).map(message => ({ role: message.role, content: message.content.slice(0, 600) })),
        }),
      });
      const result = await response.json() as {
        answer?: string;
        message?: string;
        usage?: Usage | null;
      };
      await assertTutorSession(sessionUserId); // Verify AFTER answer, before showing old-account text.
      const answer = result.answer;
      if (!response.ok || !answer) throw new Error(result.message || "AI 暂时没有正常回答，请稍后重试。");
      setMessages(previous => [...previous, { role: "assistant", content: answer }]);
      setUsage(result.usage ?? null);
    } catch (reason) {
      if (reason instanceof TutorSessionChangedError) {
        setMessages([]);
        setDraft("");
        setQuota(null);
        setUsage(null);
        setError(reason.message);
      } else {
        setMessages(earlier);
        setDraft(value);
        setError(reason instanceof Error ? reason.message : "AI 服务暂时不可用。");
      }
    } finally {
      setBusy(false);
      // Failed upstream calls may also have reserved a quota slot. Re-fetch authoritative usage.
      void readQuota().then(setQuota).catch(() => {});
    }
  }

  useEffect(() => {
    if (open || !restoreTriggerFocusRef.current) return;
    restoreTriggerFocusRef.current = false;
    const frame = window.requestAnimationFrame(() => triggerRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [open]);

  function onDraftKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  // Avoid drawing a second conversation widget inside the dedicated full-page chat.
  // Authentication forms are deliberately uncluttered; the tutor remains available after login.
  if (pathname === "/ai-tutor" || pathname === "/login" || pathname === "/register") return null;

  const disabled = busy || !quota || quota.loginRequired || quota.configured === false || quota.enabled === false || (quota.remainingToday !== undefined && quota.remainingToday <= 0);

  return <div className="agf-root">
    {!open && <button
      type="button"
      ref={triggerRef}
      className="agf-launcher"
      onClick={() => { setError(""); setQuota(null); setOpen(true); }}
      aria-label="打开 AgentGuard AI 安全学习伙伴"
      aria-haspopup="dialog"
      aria-expanded={false}
    ><span className="agf-launch-icon"><MessageCircle size={26} aria-hidden="true" /><span className="agf-launch-spark" aria-hidden="true">✦</span></span><span className="agf-launch-text"><strong>问问 AI</strong><small>DeepSeek Flash</small></span></button>}

    {open && <>
      <div className="agf-backdrop" onClick={close} aria-hidden="true" />
      <section ref={panelRef} className="agf-panel" role="dialog" aria-modal="true" aria-labelledby={panelLabel}>
        <header className="agf-header">
          <span className="agf-avatar"><Bot size={24} aria-hidden="true" /></span>
          <div className="agf-identity"><strong id={panelLabel}>AI 安全学习伙伴</strong><small><span className="agf-live-dot" /> DeepSeek Flash · 真实模型</small></div>
          <Link href="/ai-tutor" className="agf-header-button" title="打开完整 AI 助教页面" aria-label="打开完整 AI 助教页面" onClick={close}><Maximize2 size={18}/></Link>
          <button type="button" ref={closeButtonRef} className="agf-header-button" aria-label="关闭 AI 对话" onClick={close}><X size={20}/></button>
        </header>

        <div className="agf-context"><Sparkles size={15} aria-hidden="true" /><span>当前页面：<strong>{page.label}</strong></span><span className="agf-context-label">页面引导</span></div>

        <div className="agf-messages" ref={messagesRef} aria-label="与 AI 学习伙伴的对话" aria-live="polite">
          <div className="agf-message agf-assistant"><span className="agf-msg-avatar" aria-hidden="true">🤖</span><div className="agf-bubble">{page.greeting}<p>我只知道当前页面类型，不会读取你的表单、密码或本次实验详情。请勿发送个人敏感资料。</p></div></div>
          {messages.map((message, index) => <div key={index} className={`agf-message ${message.role === "user" ? "agf-user" : "agf-assistant"}`}>
            {message.role === "assistant" && <span className="agf-msg-avatar" aria-hidden="true">🤖</span>}
            <div className="agf-bubble">{message.content}</div>
          </div>)}
          {busy && <div className="agf-message agf-assistant"><span className="agf-msg-avatar" aria-hidden="true">🤖</span><div className="agf-bubble agf-thinking"><LoaderCircle className="agf-spin" size={18} aria-hidden="true"/> 正在等待 DeepSeek 回答…</div></div>}
        </div>

        <div className="agf-bottom">
          {!messages.length && <div className="agf-quick" aria-label="快捷问题">
            <span>试试这样问：</span>
            {page.suggestions.map(text => <button key={text} type="button" onClick={() => { setDraft(text); inputRef.current?.focus(); }}>{text}<ArrowRight size={13}/></button>)}
          </div>}
          {usage && <div className="agf-usage"><Wallet size={14} aria-hidden="true" /> 本轮 {usage.inputTokens} 输入 / {usage.outputTokens} 输出 tokens{usage.estimatedPeakCny !== null ? ` · 高峰价估算 ¥${usage.estimatedPeakCny.toFixed(5)}` : ""}</div>}
          {error && <div className="agf-error" role="alert"><CircleAlert size={17} aria-hidden="true" />{error}</div>}
          {quota?.loginRequired && <div className="agf-notice">请先登录，才能调用真实 AI。<Link href="/login" onClick={close}>前往登录 <ArrowRight size={13}/></Link></div>}
          {quota?.configured === false && !quota.loginRequired && <div className="agf-notice">管理员尚未配置 DeepSeek API Key。</div>}
          {quota?.enabled === false && !quota.loginRequired && <div className="agf-notice">AI 助教暂未开放。</div>}
          {quota?.remainingToday === 0 && <div className="agf-notice">今天的 AI 问答额度已用完，明天再来。</div>}
          <form className="agf-form" onSubmit={submit}>
            <label className="agf-visually-hidden" htmlFor={`${id}-input`}>向 AI 学习伙伴提问</label>
            <textarea
              ref={inputRef}
              id={`${id}-input`}
              rows={2}
              minLength={4}
              maxLength={600}
              value={draft}
              placeholder="问一个 AI 安全问题…"
              onChange={event => setDraft(event.target.value)}
              onKeyDown={onDraftKeyDown}
              disabled={disabled}
              aria-label="向 AI 学习伙伴提问"
            />
            <div className="agf-actions"><span>{!quota ? "正在检查账户…" : quota?.remainingToday !== undefined ? `今天剩余 ${quota.remainingToday} 次` : "每次提问计入每日额度"} · {draft.length}/600 字</span>
              <div className="agf-action-buttons">
                {messages.length > 0 && <button className="agf-reset" type="button" onClick={() => { setMessages([]); setUsage(null); setError(""); }} disabled={busy} title="清空本次聊天" aria-label="清空本次聊天"><Trash2 size={16}/></button>}
                <button className="agf-submit" type="submit" disabled={disabled || draft.trim().length < 4} aria-label="发送问题">{busy ? <LoaderCircle size={19} className="agf-spin"/> : <Send size={19}/>}</button>
              </div>
            </div>
          </form>
          <div className="agf-privacy"><ShieldCheck size={13} aria-hidden="true" /> 提问会发送给 DeepSeek；本站不保存聊天正文，也不会替你执行操作。</div>
        </div>
      </section>
    </>}
  </div>;
}
