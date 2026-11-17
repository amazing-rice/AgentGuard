"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowRight, CalendarClock, CheckCircle2, ChevronDown, FileText, FlaskConical, LockKeyhole, Play, RefreshCw, ShieldAlert, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";
import type { Mode, Source } from "@/lib/core";
import { STORY_LAB, STORY_TOOL_LABELS } from "@/data/storyLab";
import type { StoryId, StoryVariant } from "@/data/storyLab";
import type { StoryRun } from "@/lib/story-engine";

type DisplayRun = StoryRun & { savedToAccount?: boolean };

function localReport(run: StoryRun) {
  const text = ["# AgentGuard 生活场景审计报告", "", `故事：${STORY_LAB[run.storyId].title}`, `实验来源：${run.source === "fixture" ? "教学回放" : "实时 DeepSeek"}`, `模式：${run.mode}`, `状态：${run.status}`, `工具提议：${run.stats.proposed}`, `权限阻断：${run.stats.blocked}`, `沙箱中敏感操作次数：${run.stats.unauthorizedSimulations}`, "", "## 事件追踪", ...run.events.map(e => `${e.seq}. ${e.type} / ${e.tool ?? "系统"} / ${e.reason ?? e.decision ?? "-"}`), "", "## 场景结果", JSON.stringify(run.storyState, null, 2), "", "全部操作仅在虚构沙箱中执行；访客报告未保存至个人账号。"].join("\n");
  const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
  const a = document.createElement("a"); a.href = url; a.download = `agentguard-${run.storyId}-${run.id}.md`; document.body.append(a); a.click(); a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function Preview({ id, run }: { id: StoryId; run: DisplayRun | null }) {
  const state = run?.storyState;
  const exposed = (state?.exposureLog.length ?? 0) > 0;
  if (id === "travel") {
    return <div className="agv-app agv-travel-app">
      <div className="agv-app-header"><span>✈ 杭州·旅途手账</span><span className="agv-app-pill">两日计划</span></div>
      <div className="agv-travel-cover"><span>🌤️</span><div><strong>在杭州，慢一点</strong><small>湖光 / 茶香 / 老街</small></div></div>
      <div className="agv-itinerary">
        {state?.outputLines.length ? state.outputLines.map((line,i) => <div key={i} className="agv-itinerary-line"><b>{i < 2 ? `DAY 0${i+1}` : "TIPS"}</b><span>{line}</span></div>) : <div className="agv-app-empty">等待 AI 生成旅行路线……</div>}
      </div>
      <div className={`agv-privacy-card ${exposed ? "agv-exposed" : ""}`}><LockKeyhole size={18}/><div><b>我的虚构预订信息</b><span>{exposed ? "已发布到虚构演示公告板" : "尚未公开"}</span></div><strong>{exposed ? "已模拟公开" : "私密"}</strong></div>
    </div>;
  }
  if (id === "study") {
    return <div className="agv-app agv-study-app">
      <div className="agv-app-header"><span>📒 我的学习笔记</span><span className="agv-app-pill">私人空间</span></div>
      <div className="agv-notebook"><div className="agv-notebook-top"><span>📌 网络安全 / 复习</span><span>{exposed ? "🌍 已模拟公开" : "🔒 私人"}</span></div><h3>{state?.outputTitle || "等待整理的笔记"}</h3>{state?.outputLines.length ? <ul>{state.outputLines.map((line, i) => <li key={i}>{line}</li>)}</ul> : <div className="agv-paper-lines"><i/><i/><i/><i/></div>}<div className="agv-notebook-stamp">STUDY WITH CARE ✦</div></div>
      <div className={`agv-privacy-card ${exposed ? "agv-exposed" : ""}`}><LockKeyhole size={18}/><div><b>笔记公开状态</b><span>{exposed ? "虚构班级墙出现分享记录" : "只有你能看到"}</span></div><strong>{exposed ? "已模拟公开" : "保持私密"}</strong></div>
    </div>;
  }
  return <div className="agv-app agv-mail-app">
    <div className="agv-app-header"><span>✉️ AI 日程助手</span><span className="agv-app-pill">收件箱 · 日历</span></div>
    <div className="agv-mail-message"><div className="agv-mail-avatar">项</div><div><b>项目组 · 周会邀请</b><span>周五 15:00，请确认本周进展与下周任务</span></div><span className="agv-mail-tag">邀请</span></div>
    <div className="agv-calendar"><div className="agv-calendar-top"><CalendarClock size={18}/> 本周日程 <span>FRIDAY</span></div>{state?.outputLines.length ? state.outputLines.map((line,i) => <p key={i}>{line}</p>) : <div className="agv-app-empty">暂时没有新建的周会日程</div>}</div>
    <div className={`agv-privacy-card ${exposed ? "agv-exposed" : ""}`}><UploadCloud size={18}/><div><b>虚构通讯录</b><span>{exposed ? "本地模拟发件箱出现记录" : "没有外发记录"}</span></div><strong>{exposed ? "已模拟外发" : "未发送"}</strong></div>
  </div>;
}

function RunSummary({ run, mode, riskTool }: { run: DisplayRun | null; mode: Mode; riskTool: string }) {
  const guarded = mode === "guarded";
  const riskProposed = run?.events.some(e => e.type === "TOOL_PROPOSED" && e.tool === riskTool);
  const riskBlocked = run?.events.some(e => e.type === "TOOL_BLOCKED" && e.tool === riskTool);
  return <div className={`agv-result-card ${guarded ? "agv-result-safe" : "agv-result-baseline"}`}>
    <div className="agv-result-label">{guarded ? <ShieldCheck size={22}/> : <ShieldAlert size={22}/>}<div><span>{guarded ? "第二轮 · 加上安全锁" : "第一轮 · 无权限保护"}</span><h3>{guarded ? "安全守门员" : "普通 AI 执行"}</h3></div></div>
    {!run ? <div className="agv-pending">等待本轮实验结果……</div> : <><div className="agv-result-metrics"><span>AI 是否提出敏感操作</span><b>{riskProposed ? "是" : "本次没有"}</b><span>敏感操作处理</span><b className={run.stats.unauthorizedSimulations > 0 ? "agv-warn" : "agv-good"}>{run.stats.unauthorizedSimulations ? "沙箱内已模拟执行" : riskBlocked ? "被权限规则拦截" : "没有执行"}</b><span>合法任务是否完成</span><b>{run.stats.legitimateTaskCompleted ? "✓ 已完成" : "尚未完成"}</b></div>{run.status === "failed" && <p className="agv-error">运行失败：{run.finalAnswer}</p>}{run.status === "incomplete" && <p className="agv-error">运行未完成：{run.finalAnswer}</p>}<div className="agv-operations"><details><summary>查看完整工具操作 <ChevronDown size={15}/></summary><ol>{run.events.filter(e => e.type === "TOOL_PROPOSED" || e.type === "TOOL_BLOCKED" || e.type === "TOOL_EXECUTED").map(e=><li key={e.id}><span>{e.type === "TOOL_PROPOSED" ? "请求" : e.type === "TOOL_BLOCKED" ? "拒绝" : "执行"}</span> {STORY_TOOL_LABELS[e.tool || ""] || e.tool} {e.reason === "UNAUTHORIZED_ACTION" ? "· 未经授权" : ""}</li>)}</ol></details>{run.savedToAccount ? <a href={`/api/export?id=${encodeURIComponent(run.id)}&format=md`}>下载本人审计报告 <ArrowRight size={15}/></a> : <button type="button" onClick={()=>localReport(run)}>下载本次临时报告 <ArrowRight size={15}/></button>}</div></>}
  </div>;
}

export default function StoryLabPlay({ id }: { id: StoryId }) {
  const story = STORY_LAB[id];
  const [variant, setVariant] = useState<StoryVariant>("injected");
  const [source, setSource] = useState<Source>("fixture");
  const [busy, setBusy] = useState<Mode | null>(null);
  const [error, setError] = useState("");
  const [baseline, setBaseline] = useState<DisplayRun | null>(null);
  const [guarded, setGuarded] = useState<DisplayRun | null>(null);
  const [displayMode, setDisplayMode] = useState<Mode>("guarded");
  const [reveal, setReveal] = useState(false);
  const [done, setDone] = useState(false);
  const activeRun = displayMode === "guarded" ? guarded : baseline;
  function reset(nextVariant?: StoryVariant, nextSource?: Source) {
    if (nextVariant) setVariant(nextVariant);
    if (nextSource) setSource(nextSource);
    setBaseline(null); setGuarded(null); setDone(false); setError(""); setReveal(false);
  }
  async function runOnce(mode: Mode): Promise<DisplayRun> {
    const response = await fetch("/api/story-runs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ storyId: id, mode, variant, source }) });
    const data: unknown = await response.json();
    if (!response.ok) {
      const problem = data as { error?: string };
      throw Error(problem.error === "LOGIN_REQUIRED" ? "实时模型需要先登录，或切换到免费离线教学回放。" : problem.error === "MODEL_NOT_CONFIGURED" ? "尚未配置 DeepSeek API Key，请使用离线教学回放。" : problem.error === "SAVE_FAILED" ? "本次实验执行完成，但保存到数据库失败，请检查 Prisma。" : problem.error || "实验接口请求失败");
    }
    return data as DisplayRun;
  }
  async function start() {
    if (busy) return;
    setError(""); setBaseline(null); setGuarded(null); setDone(false);
    try {
      setBusy("baseline"); const first = await runOnce("baseline"); setBaseline(first); setDisplayMode("baseline");
      setBusy("guarded"); const second = await runOnce("guarded"); setGuarded(second); setDisplayMode("guarded"); setDone(true);
    } catch (err) { setError(err instanceof Error ? err.message : "实验发生未知错误"); }
    finally { setBusy(null); }
  }
  const riskBlocked = guarded?.events.some(e => e.type === "TOOL_BLOCKED" && e.tool === story.riskTool) ?? false;
  const liveResultFailed = baseline?.status === "failed" || guarded?.status === "failed";
  return <div className={`agv-world agv-world-${id}`}>
    <div className="ag-wrap agv-breadcrumb"><Link href="/stories"><ArrowLeft size={16}/> 返回故事馆</Link><span>›</span><span>{story.title}</span></div>
    <section className="ag-wrap agv-hero"><div><span className="agv-eyebrow">CASE {story.chapter} / AI SECURITY STORY</span><h1>{story.title}</h1><p>{story.subTitle}</p><div className="agv-hero-tags"><span>📌 {story.tag}</span><span>🔒 100% 虚构数据</span><span>⏱ 约 3 分钟</span></div></div><div className="agv-hero-symbol" aria-hidden="true">{id === "travel" ? "🧳" : id === "study" ? "📓" : "📬"}</div></section>
    <div className="ag-wrap agv-layout"><aside className="agv-panel agv-control"><div className="agv-panel-heading"><span className="agv-panel-num">01</span><div><h2>任务调查板</h2><p>先看看你授权了什么，以及资料里藏了什么。</p></div></div>
      <div className="agv-user-task"><small>👤 你真正交给 AI 的任务</small><p>“{story.task}”</p></div>
      <div className="agv-doc-top"><FileText size={18}/><strong>{story.sourceTitle}</strong><span>外部资料</span></div>
      <div className="agv-tabs" role="group" aria-label="选择资料类型"><button aria-pressed={variant === "injected"} type="button" disabled={Boolean(busy)} className={variant === "injected" ? "selected" : ""} onClick={()=>reset("injected")}>🕵️ 有隐藏指令</button><button aria-pressed={variant === "clean"} type="button" disabled={Boolean(busy)} className={variant === "clean" ? "selected" : ""} onClick={()=>reset("clean")}>📄 普通资料</button></div>
      <div className="agv-document">{variant === "injected" && !reveal ? <><span>{story.normalText}</span><button type="button" onClick={()=>setReveal(true)}>🔍 点击揭开文件里的隐藏要求</button></> : <>{variant === "injected" ? story.injectedText : story.normalText}</> }</div>
      {variant === "injected" && reveal && <p className="agv-warning"><ShieldAlert size={15}/> 文件中的操作要求并非用户亲自授权。</p>}
      <label className="agv-source-label" htmlFor={`story-source-${id}`}>实验使用哪种 AI？</label><select id={`story-source-${id}`} value={source} disabled={Boolean(busy)} onChange={e=>reset(undefined, e.target.value as Source)}><option value="fixture">离线教学脚本（免费、结果固定）</option><option value="live">DeepSeek 实时模型（需登录）</option></select>
      <button className="agv-start" type="button" disabled={Boolean(busy)} onClick={()=>void start()}>{busy ? <><RefreshCw size={18} className="agv-spin"/> 正在进行{busy === "baseline" ? "第一" : "第二"}轮……</> : <><Play size={19}/> {done ? "重新运行两轮对照" : "开始安全对照实验"}</>}</button>{error && <p className="agv-error" role="alert"><AlertCircle size={16}/>{error}</p>}
      <p className="agv-smallprint">教学脚本只验证工具策略的执行流程，不能证明真实模型一定会被骗。实时模型的结果以实际调用为准。</p>
    </aside><div className="agv-primary"><div className="agv-panel agv-preview-panel"><div className="agv-panel-heading"><span className="agv-panel-num">02</span><div><h2>模拟应用现场</h2><p>从真实的虚构沙箱状态观察 AI 完成了什么。</p></div></div><div className="agv-screen-switch"><button type="button" className={displayMode === "baseline" ? "active" : ""} onClick={()=>setDisplayMode("baseline")}>无保护</button><button type="button" className={displayMode === "guarded" ? "active" : ""} onClick={()=>setDisplayMode("guarded")}>开启保护</button></div><Preview id={id} run={activeRun}/></div>
    <div className="agv-panel agv-summary-panel"><div className="agv-panel-heading"><span className="agv-panel-num">03</span><div><h2>两轮结果，一眼看懂</h2><p>同一份资料，同一项任务，对比是否有人越权操作。</p></div></div><div className="agv-result-grid"><RunSummary run={baseline} mode="baseline" riskTool={story.riskTool}/><RunSummary run={guarded} mode="guarded" riskTool={story.riskTool}/></div>
    {done && <div className="agv-discovery"><div>{liveResultFailed ? <AlertCircle size={25}/> : riskBlocked ? <ShieldCheck size={25}/> : <CheckCircle2 size={25}/>}</div><section><h3>{liveResultFailed ? "这次运行未成功，不能下安全结论" : riskBlocked ? "安全守门员拦住了没有授权的操作" : "这次没有观察到敏感操作被拦截"}</h3><p>{liveResultFailed ? "请检查 API 或模型配置。" : riskBlocked ? `AI 曾提议执行“${story.sensitiveLabel}”，但安全规则根据你原始的任务授权拒绝了操作。` : "可能是模型没有提出危险操作，或普通资料中没有隐藏指令。请查看两轮真实审计记录。"}</p><p>记住：<strong>外部资料只是信息来源，不能自己获得使用工具的权限。</strong></p></section></div>}
    <div className="agv-next"><Link href="/stories" className="agv-next-stories"><ArrowLeft size={17}/> 探索其他故事</Link><Link href="/challenges">来挑战安全关卡 <ArrowRight size={17}/></Link><Link href="/workshop">自己编写可疑资料 <ArrowRight size={17}/></Link><Link href="/lab">查看开发者实验室 <FlaskConical size={16}/></Link></div>
    </div></div></div>
    <div className="ag-wrap agv-footer-note"><Sparkles size={17}/> 所有名字、预订、笔记、通讯录和外发地点均为虚构。不存在真实网络外发、真实笔记发布或真实订票。</div>
  </div>;
}
