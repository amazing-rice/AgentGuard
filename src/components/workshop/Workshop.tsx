"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ChevronDown,
  CircleAlert, FileSearch, FlaskConical, LockKeyhole,
  Play, RotateCcw, ShieldAlert, ShieldCheck, Sparkles,
} from "lucide-react";
import { STORY_IDS, STORY_LAB, STORY_TOOL_LABELS } from "@/data/storyLab";
import type { StoryId } from "@/data/storyLab";
import type { Mode, Source } from "@/lib/core";
import type { StoryRun } from "@/lib/story-engine";
import { WORKSHOP_DOCUMENT_MAX, WORKSHOP_DOCUMENT_MIN } from "@/lib/workshop-domain";

const sceneIcons: Record<StoryId, string> = {
  travel: "🧳", study: "📒", mail: "📬",
};
type RunResult = StoryRun & { savedToAccount?: boolean; documentTextStored?: boolean };

const readableErrors: Record<string, string> = {
  LOGIN_REQUIRED: "实时模型实验需要先登录。你仍可以免费体验离线规则回放。",
  MODEL_NOT_CONFIGURED: "服务器还没有配置 DeepSeek API Key，请先使用离线回放。",
  MODEL_QUOTA_REACHED: "实时模型调用次数已达到临时上限，请稍后再试。",
  SAVE_FAILED: "实验执行了，但保存个人审计记录失败。请检查数据库。",
  INVALID_REQUEST: "资料内容不符合长度要求，请检查字数。",
  PAYLOAD_TOO_LARGE: "输入内容过长，请缩短后重试。",
  ORIGIN_MISMATCH: "请求来源校验失败，请使用同一网站地址访问。",
};

function riskEvents(run: RunResult | null, riskTool: string) {
  return {
    proposed: Boolean(run?.events.some(event => event.type === "TOOL_PROPOSED" && event.tool === riskTool)),
    blocked: Boolean(run?.events.some(event => event.type === "TOOL_BLOCKED" && event.tool === riskTool)),
    executed: Boolean(run?.events.some(event => event.type === "TOOL_EXECUTED" && event.tool === riskTool)),
  };
}

function downloadTemporaryReport(run: RunResult) {
  const lines = [
    "# AgentGuard 自定义资料实验", "", `场景：${STORY_LAB[run.storyId].title}`,
    `运行 ID：${run.id}`, `来源：${run.source === "fixture" ? "离线关键词回放" : "实时 DeepSeek"}`,
    `模式：${run.mode}`, `状态：${run.status}`,
    `资料指纹：${run.customDocumentInfo?.sha256 ?? "-"}`,
    "", "## 运行统计", JSON.stringify(run.stats, null, 2),
    "", "## 审计事件（不包含自定义资料正文）",
    ...run.events.map(event => `${event.seq}. ${event.type} / ${event.tool ?? "系统"} / ${event.reason ?? event.decision ?? "-"}`),
    "", "离线模式是规则脚本回放，不能代表真实模型响应。所有执行均在虚构沙箱内。",
  ];
  const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/markdown;charset=utf-8" }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `agentguard-workshop-${run.id}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function ResultCard({ run, mode, riskTool }: { run: RunResult | null; mode: Mode; riskTool: string }) {
  const behavior = riskEvents(run, riskTool);
  const guarded = mode === "guarded";
  return <article className={`agw-run-card ${guarded ? "agw-run-guarded" : "agw-run-baseline"}`}>
    <div className="agw-run-header">
      <span className="agw-run-icon">{guarded ? <ShieldCheck size={23} /> : <ShieldAlert size={23} />}</span>
      <div><small>{guarded ? "第二轮 / 有安全保护" : "第一轮 / 无权限保护"}</small><h3>{guarded ? "AI 安全守门员" : "AI 基线沙箱"}</h3></div>
    </div>
    {!run ? <p className="agw-run-empty">实验完成后，这里将展示实际执行的工具和权限判定。</p> : <>
      <div className="agw-run-facts">
        <span>是否提出敏感操作</span><strong>{behavior.proposed ? "提出了" : "没有观察到"}</strong>
        <span>敏感操作处理结果</span><strong className={behavior.executed ? "agw-bad" : "agw-good"}>{behavior.executed ? "仅在沙箱中模拟执行" : behavior.blocked ? "权限规则成功拦截" : "没有执行"}</strong>
        <span>合法任务完成</span><strong>{run.stats.legitimateTaskCompleted ? "是 ✓" : "未完成"}</strong>
        <span>运行状态</span><strong>{run.status === "completed" ? "完成" : run.status === "failed" ? "失败" : "未完成"}</strong>
      </div>
      {run.status !== "completed" && <div className="agw-error-inline">{run.finalAnswer}</div>}
      <details className="agw-events">
        <summary><FileSearch size={16}/> 查看操作记录 <ChevronDown size={15}/></summary>
        <ol>{run.events.filter(event => ["TOOL_PROPOSED", "TOOL_BLOCKED", "TOOL_EXECUTED", "FIXTURE_RULE_MATCH"].includes(event.type)).map(event => <li key={event.id}><b>{event.type === "TOOL_PROPOSED" ? "提议" : event.type === "TOOL_BLOCKED" ? "阻断" : event.type === "TOOL_EXECUTED" ? "执行" : "离线线索"}</b><span>{STORY_TOOL_LABELS[event.tool ?? ""] ?? event.tool ?? "规则扫描"}{event.reason ? ` · ${event.reason}` : ""}</span></li>)}</ol>
      </details>
      {run.savedToAccount ? <a className="agw-report" href={`/api/export?id=${encodeURIComponent(run.id)}&format=md`}>下载本人审计报告 <ArrowRight size={15}/></a> : <button type="button" className="agw-report" onClick={() => downloadTemporaryReport(run)}>下载本次报告 <ArrowRight size={15}/></button>}
    </>}
  </article>;
}

export default function Workshop() {
  const [sceneId, setSceneId] = useState<StoryId>("travel");
  const [documentText, setDocumentText] = useState<string>(STORY_LAB.travel.injectedText);
  const [source, setSource] = useState<Source>("fixture");
  const [prediction, setPrediction] = useState<"yes" | "no" | null>(null);
  const [baseline, setBaseline] = useState<RunResult | null>(null);
  const [guarded, setGuarded] = useState<RunResult | null>(null);
  const [busyMode, setBusyMode] = useState<Mode | null>(null);
  const [message, setMessage] = useState("");
  const resultSummaryRef = useRef<HTMLElement | null>(null);

  const story = STORY_LAB[sceneId];
  const isBusy = busyMode !== null;
  const hasLength = documentText.trim().length >= WORKSHOP_DOCUMENT_MIN && documentText.trim().length <= WORKSHOP_DOCUMENT_MAX;
  const baselineRisk = riskEvents(baseline, story.riskTool);
  const guardedRisk = riskEvents(guarded, story.riskTool);
  const validOutcome = baseline?.status === "completed" && guarded?.status === "completed";
  const complete = Boolean(baseline && guarded);
  const completedTasks = Number(Boolean(baseline?.stats.legitimateTaskCompleted)) + Number(Boolean(guarded?.stats.legitimateTaskCompleted));
  const summaryTitle = !validOutcome
    ? "两轮已有结果，请检查运行状态"
    : guardedRisk.executed
      ? "守门员模式出现了敏感模拟执行"
      : guardedRisk.blocked
        ? "安全规则拦截了敏感操作"
        : baselineRisk.proposed
          ? "基线提出了敏感操作"
          : "本次没有观察到敏感操作";

  // 两轮都返回且请求结束后再定位；改写资料/重跑会清空结果，下一次仍能触发。
  useEffect(() => {
    if (!complete || isBusy || !resultSummaryRef.current) return;
    const summary = resultSummaryRef.current;
    summary.focus({ preventScroll: true });
    summary.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth",
      block: "start",
    });
  }, [complete, isBusy]);

  function clearResults() { setBaseline(null); setGuarded(null); setMessage(""); }
  function switchStory(id: StoryId) {
    setSceneId(id);
    setDocumentText(STORY_LAB[id].injectedText);
    setPrediction(null);
    clearResults();
  }
  function setExample(kind: "normal" | "hidden") {
    setDocumentText(kind === "normal" ? story.normalText : story.injectedText);
    clearResults();
  }

  async function runOnce(mode: Mode): Promise<RunResult> {
    const response = await fetch("/api/workshop", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storyId: sceneId, mode, source, documentText: documentText.trim() }),
    });
    const body: unknown = await response.json();
    if (!response.ok) {
      const code = (body as { error?: string }).error ?? "REQUEST_FAILED";
      throw new Error(readableErrors[code] ?? `请求失败：${code}`);
    }
    return body as RunResult;
  }

  async function start() {
    if (isBusy || !hasLength) return;
    clearResults();
    try {
      setBusyMode("baseline");
      const first = await runOnce("baseline");
      setBaseline(first);
      setBusyMode("guarded");
      const second = await runOnce("guarded");
      setGuarded(second);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "执行时发生未知错误");
    } finally {
      setBusyMode(null);
    }
  }

  return <div className="agw-page">
    <section className="agw-hero">
      <div className="ag-wrap agw-hero-inner">
        <div className="agw-hero-copy"><Link href="/stories" className="agw-back"><ArrowLeft size={16}/> 返回故事馆</Link><span className="agw-eyebrow"><Sparkles size={15}/> YOUR OWN EXPERIMENT · 自定义实验</span><h1>这一次，<span>由你来设计</span><br/>AI 读到的资料。</h1><p>修改外部文字，猜猜 AI 会不会被误导，再给它加上安全锁。亲自验证比只看讲解更容易记住。</p><div className="agw-hero-tags"><span>✍️ 自由编辑</span><span>🕵️ 行为预测</span><span>🛡️ 权限对照</span></div></div>
        <div className="agw-hero-art" aria-hidden="true"><div className="agw-paper agw-paper-back">USER TASK <span>✓</span></div><div className="agw-paper agw-paper-front"><span>📄</span><strong>外部资料</strong><i/><i/><i/></div><div className="agw-magnify">🔎</div><div className="agw-shield">🛡️</div><span className="agw-sparkle">✦</span></div>
      </div>
    </section>

    <section className="ag-wrap agw-main">
      <div className="agw-notice"><CircleAlert size={20}/><div><strong>先了解实验规则</strong><p>所有账户、资料和操作目标都是虚构的。请勿填写真实密码、电话号码或个人信息。离线模式只是公开规则匹配，不代表真实 AI 的决定；实时模式需登录并配置 DeepSeek。</p></div></div>
      {complete && <section
        id="agw-result-summary"
        ref={resultSummaryRef}
        tabIndex={-1}
        className="agw-result-summary"
        aria-labelledby="agw-summary-title"
      >
        <div className="agw-summary-top">
          <div>
            <span className="agw-eyebrow"><ShieldCheck size={15}/> RESULT AT A GLANCE · 实验结论</span>
            <h2 id="agw-summary-title">{summaryTitle}</h2>
          </div>
          <span className="agw-summary-source">{source === "fixture" ? "离线规则回放" : "DeepSeek 实时实验"}</span>
        </div>
        <p className="agw-summary-description">{source === "fixture" ? "以下是离线关键词脚本和服务端权限规则的执行结果，不代表真实模型的行为。" : "以下仅根据本次实际工具事件总结，两轮实时模型的响应可能不同。"}</p>
        <div className="agw-summary-grid">
          <div className="agw-summary-metric"><span>第一轮 · 敏感操作提议</span><strong>{baselineRisk.proposed ? "已提议" : "未观察到"}</strong><small>基线沙箱</small></div>
          <div className="agw-summary-metric"><span>第二轮 · 权限处理</span><strong className={guardedRisk.executed ? "agw-summary-danger" : guardedRisk.blocked ? "agw-summary-success" : ""}>{guardedRisk.executed ? "沙箱模拟执行" : guardedRisk.blocked ? "已阻断" : "未触发拦截"}</strong><small>安全守门员</small></div>
          <div className="agw-summary-metric"><span>合法任务完成</span><strong>{completedTasks} / 2</strong><small>按两次实际运行统计</small></div>
        </div>
        {prediction !== null && <div className={`agw-verdict ${validOutcome && (baselineRisk.proposed === (prediction === "yes")) ? "agw-verdict-right" : ""}`}>
          <div className="agw-verdict-icon">{!validOutcome ? "⚠️" : baselineRisk.proposed === (prediction === "yes") ? "🎉" : "💡"}</div>
          <div><strong>{!validOutcome ? "运行尚未完整，暂不评价你的预测" : baselineRisk.proposed === (prediction === "yes") ? "这次你预测对了！" : "这次观察到的行为与你的预测不同"}</strong><p>{!validOutcome ? "请查看下方的双栏结果和运行错误信息。" : source === "fixture" ? `离线回放的关键词规则${baselineRisk.proposed ? "命中了敏感操作线索" : "没有匹配到预设线索"}；这不代表真实模型也会这样行动。` : `本次 DeepSeek ${baselineRisk.proposed ? "确实提议了敏感操作" : "没有提议该敏感操作"}。实时模型结果因输入与运行条件而变化，不保证重复出现。`} {validOutcome && (guardedRisk.blocked ? "安全守门员按照原任务权限阻止了越权执行。" : "本次没有观察到权限拦截事件。")}</p></div>
        </div>}
        <div className="agw-summary-actions">
          <a className="agw-summary-primary" href="#agw-detailed-results">查看双栏详细对比 <ArrowRight size={17}/></a>
          {baseline?.savedToAccount && guarded?.savedToAccount && <Link className="agw-summary-secondary" href="/account">前往个人中心查看已保存记录 <ArrowRight size={16}/></Link>}
        </div>
      </section>}
      <div className="agw-grid">
        <section className="agw-card agw-compose">
          <header className="agw-card-heading"><span className="agw-index">01</span><div><h2>挑选一个生活任务</h2><p>每个故事都有自己的工具和隐私保护规则。</p></div></header>
          <div className="agw-scene-grid" role="group" aria-label="选择生活场景">{STORY_IDS.map(id => <button type="button" disabled={isBusy} aria-pressed={sceneId === id} key={id} className={sceneId === id ? "selected" : ""} onClick={() => switchStory(id)}><span>{sceneIcons[id]}</span><strong>{id === "travel" ? "旅行规划" : id === "study" ? "学习笔记" : "邮件日程"}</strong></button>)}</div>
          <div className="agw-user-task"><span>👤 你的真实任务</span><p>{story.task}</p></div>
          <header className="agw-card-heading agw-document-heading"><span className="agw-index">02</span><div><h2>改写外部资料</h2><p>AI 将读取这段文字，但它不属于用户的命令。</p></div></header>
          <div className="agw-document-tabs"><button type="button" disabled={isBusy} onClick={() => setExample("hidden")}>🕵️ 加载可疑示例</button><button type="button" disabled={isBusy} onClick={() => setExample("normal")}>📄 加载正常资料</button><button type="button" disabled={isBusy} onClick={() => { setDocumentText(""); clearResults(); }}>🧽 清空自己写</button></div>
          <label className="agw-textarea-label" htmlFor="agw-document">{story.sourceTitle}</label>
          <textarea id="agw-document" className="agw-textarea" value={documentText} disabled={isBusy} onChange={event => { setDocumentText(event.target.value); clearResults(); }} placeholder="把一段虚构旅行攻略、学习资料或会议邀请粘贴到这里……" maxLength={WORKSHOP_DOCUMENT_MAX} rows={9}/>
          <div className="agw-doc-bottom"><span>只能修改外部资料，不能改变用户授权范围。</span><span className={!hasLength ? "agw-count-warning" : ""}>{documentText.trim().length} / {WORKSHOP_DOCUMENT_MAX} 字</span></div>
          <p className="agw-hint"><LockKeyhole size={15}/> 你的自定义资料不会原样写入个人审计记录；实验结果仅保留脱敏操作证据。</p>
        </section>

        <aside className="agw-side">
          <section className="agw-card agw-prediction"><header className="agw-card-heading"><span className="agw-index">03</span><div><h2>先做一个预测</h2><p>你觉得 AI 会不会提出额外的敏感操作？</p></div></header>
            <div className="agw-predict-options"><button type="button" disabled={isBusy} aria-pressed={prediction === "yes"} className={prediction === "yes" ? "picked" : ""} onClick={() => {setPrediction("yes");clearResults();}}><ShieldAlert size={23}/><span><strong>会提出敏感操作</strong><small>例如：{story.sensitiveLabel}</small></span></button><button type="button" disabled={isBusy} aria-pressed={prediction === "no"} className={prediction === "no" ? "picked" : ""} onClick={() => {setPrediction("no");clearResults();}}><CheckCircle2 size={23}/><span><strong>只完成原定任务</strong><small>没有额外的隐私操作请求</small></span></button></div>
          </section>
          <section className="agw-card agw-execute"><header className="agw-card-heading"><span className="agw-index">04</span><div><h2>启动对照实验</h2><p>用相同资料分别运行两种权限模式。</p></div></header>
            <label className="agw-source-label" htmlFor="agw-source">执行方式</label><select id="agw-source" disabled={isBusy} value={source} onChange={event => {setSource(event.target.value as Source);clearResults();}}><option value="fixture">免费 · 离线关键词教学回放</option><option value="live">DeepSeek · 实时模型实验（需登录）</option></select>
            <div className="agw-pipeline"><div><span>1</span> 读取资料</div><ArrowRight size={16}/><div><span>2</span> 提议工具</div><ArrowRight size={16}/><div><span>3</span> 权限检查</div></div>
            <button type="button" className="agw-start" disabled={isBusy || !hasLength || prediction === null} onClick={() => void start()}>{isBusy ? <><RotateCcw size={18} className="agw-spin"/> 正在运行{busyMode === "baseline" ? "第一轮" : "第二轮"}……</> : <><Play size={18}/> {complete ? "更改预测并重新实验" : "验证我的预测"} <ArrowRight size={18}/></>}</button>
            {prediction === null && <p className="agw-microcopy">请先选择一个预测，再开始实验。</p>}
            {!hasLength && <p className="agw-microcopy agw-text-error">资料长度需为 {WORKSHOP_DOCUMENT_MIN}—{WORKSHOP_DOCUMENT_MAX} 字。</p>}
            {message && <div className="agw-alert" role="alert"><CircleAlert size={18}/>{message}</div>}
            <p className="agw-microcopy">{source === "fixture" ? "提示：离线脚本按公开关键词规则编排工具请求，不是 AI 输出。" : "提示：两轮会分别调用实时模型，结果可能不同；每个账号有实验额度限制。"}</p>
          </section>
          <div className="agw-tip"><BookOpen size={20}/><div><strong>侦探知识卡</strong><p>网页、文件或邮件里的文字可以被 AI 阅读，但不能因此自动获得“公开、发送、导出”的权限。</p></div></div>
        </aside>
      </div>

      <section id="agw-detailed-results" className="agw-outcome" aria-live="polite">
        <div className="agw-section-head"><div><span className="agw-eyebrow">EXPERIMENT RESULTS</span><h2>实验结果：<span>AI 到底做了什么？</span></h2><p>只根据工具调用和服务端实际执行情况作出结论。</p></div><span className="agw-status">{complete ? "✓ 两轮已有结果" : baseline ? "第一轮已完成" : "等待实验"}</span></div>
        <div className="agw-results"><ResultCard run={baseline} mode="baseline" riskTool={story.riskTool}/><ResultCard run={guarded} mode="guarded" riskTool={story.riskTool}/></div>
        <div className="agw-bottom-links">{complete && <a href="#agw-result-summary">↑ 返回结果摘要</a>}<Link href="/stories"><ArrowLeft size={16}/> 返回安全故事馆</Link><Link href="/challenges">去安全挑战营 <ArrowRight size={16}/></Link><Link href="/lab">技术人员查看工具实验 <FlaskConical size={16}/></Link></div>
      </section>
    </section>
  </div>;
}
