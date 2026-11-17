"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardCheck, Copy, Download, FileCheck2, Info, Lightbulb, LockKeyhole, RefreshCw, ShieldAlert, ShieldCheck, Sparkles } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { checkupQuestions, evaluateCheckup, formatCheckupReport } from "@/data/checkup";

export default function CheckupPage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Array<number | null>>(Array(checkupQuestions.length).fill(null));
  const [finished, setFinished] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const question = checkupQuestions[step];
  const completed = answers.filter((value): value is number => value !== null);
  const report = finished && completed.length === checkupQuestions.length ? evaluateCheckup(completed) : null;

  function select(value: number) {
    const next = [...answers];
    next[step] = value;
    setAnswers(next);
    setCopied(false);
    setMessage("");
    if (step === checkupQuestions.length - 1) setFinished(true);
    else setStep(step + 1);
  }
  function reset() { setStep(0); setAnswers(Array(checkupQuestions.length).fill(null)); setFinished(false); setCopied(false); setMessage(""); }
  async function copy() {
    if (!report) return;
    try { await navigator.clipboard.writeText(formatCheckupReport(completed)); setCopied(true); setMessage("安全清单已复制到剪贴板。"); }
    catch { setMessage("复制失败，请使用下载报告功能。"); }
  }
  function download() {
    if (!report) return;
    const content = formatCheckupReport(completed);
    const url = URL.createObjectURL(new Blob([content], { type: "text/markdown;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "AgentGuard_安全体检报告.md";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("报告已由浏览器本地生成，未上传你的问卷答案。");
  }
  return <PublicShell>
    <section className="ag-page-hero ag-check-hero"><div className="ag-wrap ag-check-top"><div><span className="ag-overline">YOUR AI SAFETY CHECKUP · AI 安全体检</span><h1>给你的 AI 助手<br/><span>做一次安全体检！</span></h1><p>从隐私、外发、确认和审计四个维度，回答八个问题，得到有优先级的安全习惯建议。</p><div className="ag-hero-labels"><span><ClipboardCheck size={15}/> 8 道情境问题</span><span><LockKeyhole size={15}/> 不上传问卷答案</span><span><Sparkles size={15}/> 生成本地报告</span></div></div><div className="ag-check-hero-illustration" aria-hidden="true"><span>🛡️</span><div>AI SAFETY<br/><strong>CHECK-UP</strong></div><span>✨</span></div></div></section>
    <section className="ag-wrap ag-section"><div className="ag-check-layout"><div className="ag-check-main"><div className="ag-check-progress"><span>{finished ? "体检完成" : `问题 ${step + 1} / ${checkupQuestions.length}`}</span><div><div style={{ width: `${(finished ? checkupQuestions.length : step + 1) / checkupQuestions.length * 100}%` }}/></div><span>{finished ? 100 : Math.round((step + 1) / checkupQuestions.length * 100)}%</span></div>
      {report ? <div className="ag-check-result"><span className="ag-overline">YOUR PERSONAL CHECKUP REPORT</span><div className="ag-check-result-symbol">{report.score >= 10 ? <ShieldAlert size={42}/> : <ShieldCheck size={42}/>}</div><h2>{report.level}</h2><p>这是根据你填写的 8 个回答生成的使用习惯提示，<strong>不是对某款 AI 软件的真实安全扫描。</strong></p><div className="ag-check-score"><span>使用习惯风险提示分（越低越谨慎）</span><strong>{report.score}<small> / {report.max}</small></strong><span>四个维度各占 0–4 分，合计 0–16 分。</span></div>
        <h3>四个维度，一眼看懂</h3><div className="agv-check-dimensions">{report.dimensions.map(dimension => <div className="agv-check-dimension" key={dimension.id}><div><span>{dimension.icon} {dimension.title}</span><strong>{dimension.points} / 4 · {dimension.status}</strong></div><div className="agv-check-bar"><div style={{ width: `${dimension.points / dimension.max * 100}%` }}/></div></div>)}</div>
        <h3>你的优先行动清单</h3><div className="ag-recommendations">{report.recommendations.map((item, index) => <div key={item}><CheckCircle2 size={20}/><span>{index + 1}. {item}</span></div>)}</div><div className="ag-check-actions"><button type="button" className="ag-button ag-button-primary" onClick={download}><Download size={17}/> 下载 Markdown 报告</button><button type="button" className="ag-button ag-button-ghost" onClick={() => void copy()}><Copy size={17}/>{copied ? "已复制" : "复制安全清单"}</button><button type="button" className="ag-button ag-button-ghost" onClick={reset}><RefreshCw size={17}/> 重新体检</button></div><p className="agv-check-status" role="status">{message}</p><div className="agv-check-next"><div><strong>把建议变成实际操作</strong><p>先学会识别权限边界，再在虚构沙箱里观察 AI 的工具调用。</p></div><Link href="/academy" className="ag-button ag-button-primary">学习安全微课 <ArrowRight size={16}/></Link></div></div>
      : <div className="ag-check-question"><div className="ag-question-icon"><FileCheck2 size={30}/></div><span className="ag-overline">QUESTION {String(step + 1).padStart(2, "0")}</span><h2>{question.title}</h2><p>{question.detail}</p><div className="ag-check-options">{question.options.map(option => <button type="button" key={option.label} onClick={() => select(option.value)}><span className="ag-option-radio"/>{option.label}<ArrowRight size={18}/></button>)}</div><div className="agv-check-question-footer"><p className="ag-check-private"><LockKeyhole size={16}/> 答案只在当前页面中计算，不发送给服务器。</p>{step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="agv-check-back"><ArrowLeft size={16}/> 上一题</button>}</div></div>}
      </div><aside className="ag-check-aside"><div className="ag-check-aside-top"><Lightbulb size={30}/><h3>为什么要做安全体检？</h3><p>AI 助手能帮忙，也可能拥有读取、修改、发送信息的能力。学会判断：<strong>哪些操作可以交给 AI，哪些必须由你决定。</strong></p></div><div className="ag-aside-note"><ShieldCheck size={20}/><div><strong>不会上传问卷答案</strong><p>本次计算在浏览器完成；下载报告也是本地生成，不写入个人中心数据库。</p></div></div><div className="ag-aside-note"><Info size={20}/><div><strong>不是漏洞扫描器</strong><p>这份报告只反映自述的使用习惯，不代表真实 AI 产品通过了安全检测。</p></div></div><Link href="/workshop" className="ag-aside-link">想亲眼看看权限保护？<ArrowRight size={17}/></Link></aside></div></section>
  </PublicShell>;
}
