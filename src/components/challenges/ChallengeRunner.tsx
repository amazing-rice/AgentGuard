"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleHelp, LockKeyhole, RotateCcw, ShieldCheck, Sparkles, Trophy, XCircle } from "lucide-react";
import type { ChallengeDefinition } from "@/data/growth";
import { scoreChallenge } from "@/data/growth";

type SyncState = "idle" | "saving" | "saved" | "login" | "error";

export function ChallengeRunner({ challenge }: { challenge: ChallengeDefinition }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [sync, setSync] = useState<SyncState>("idle");
  const question = challenge.questions[step];
  const selected = answers[step];
  const score = finished ? scoreChallenge(challenge.id, answers) : null;

  function choose(value: string) {
    if (selected) return;
    setAnswers(previous => [...previous, value]);
  }

  async function submitResults(completedAnswers: string[]) {
    setSync("saving");
    try {
      const response = await fetch("/api/growth/challenge", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: challenge.id, answers: completedAnswers }),
      });
      if (response.status === 401) { setSync("login"); return; }
      if (!response.ok) throw new Error("SAVE_FAILED");
      setSync("saved");
    } catch { setSync("error"); }
  }

  function next() {
    if (!selected) return;
    if (step < challenge.questions.length - 1) setStep(i => i + 1);
    else { setFinished(true); void submitResults(answers); }
  }
  function restart() { setStep(0); setAnswers([]); setFinished(false); setSync("idle"); }

  return <div className="ag-growth-play">
    <div className="ag-wrap ag-crumb"><Link href="/challenges"><ArrowLeft size={16}/> 返回挑战营</Link><span> / </span><span>{challenge.title}</span></div>
    <div className="ag-wrap ag-growth-play-shell">
      <aside className={`ag-growth-play-aside ag-growth-${challenge.theme}`}>
        <span className="ag-overline">DETECTIVE MISSION #{challenge.number}</span><div className="ag-growth-play-mascot">{challenge.emoji}</div><h1>{challenge.title}</h1><p>{challenge.subtitle}</p>
        <div className="ag-growth-play-perks"><span><ShieldCheck size={17}/> 没有真实敏感数据</span><span><CircleHelp size={17}/> 每题都有知识解释</span><span><Trophy size={17}/> 登录即可保存成绩</span></div>
      </aside>
      <section className="ag-growth-play-main">
      {finished && score ? <div className="ag-growth-finish">
        <div className="ag-growth-finish-icon">{score.passed ? "🏆" : "💡"}</div><span className="ag-overline">MISSION COMPLETE</span><h2>{score.passed ? "侦探任务完成！" : "再复习一下，你会更厉害！"}</h2><p>本次答对 <strong>{score.correct} / {score.total}</strong> 题。{score.passed ? "你已经掌握了这组任务的重要安全原则。" : "可以查看解释后再挑战，最高分会被保留。"}</p>
        <div className="ag-growth-result-bar"><div style={{ width: `${score.correct / score.total * 100}%` }}/></div>
        <div className={`ag-growth-save-state ag-growth-save-${sync}`} role="status">{sync === "saving" ? "正在同步到个人中心…" : sync === "saved" ? "✓ 成绩已保存到你的个人成长档案" : sync === "login" ? "当前是访客练习。登录后再次完成挑战，即可同步成绩。" : sync === "error" ? "成绩暂未保存，请检查数据库连接后重试。" : "正在生成本次结果"}</div>
        <div className="ag-growth-actions"><button type="button" className="ag-button ag-button-ghost" onClick={restart}><RotateCcw size={16}/> 重新挑战</button><Link href="/account" className="ag-button ag-button-primary">查看我的成长 <ArrowRight size={17}/></Link><Link href="/challenges" className="ag-button ag-button-dark">返回任务地图</Link></div>
        <p className="ag-growth-hint">成绩由服务端重新评分后保存，而不是直接信任浏览器提交的分数。</p>
      </div> : <>
        <div className="ag-growth-question-top"><span>任务进度 · 第 {step + 1} / {challenge.questions.length} 题</span><span>{Math.round((step + 1) / challenge.questions.length * 100)}%</span></div>
        <div className="ag-growth-step-bar"><div style={{ width: `${(step + 1) / challenge.questions.length * 100}%` }}/></div>
        <span className="ag-growth-question-badge"><Sparkles size={16}/> {challenge.eyebrow}</span>
        <h2>{challenge.id === "find-hidden-instruction" ? "这句话，是谁在对 AI 说？" : "遇到这个工具请求，你会怎么决定？"}</h2>
        <div className="ag-growth-clue"><small>情况描述</small><strong>{question.prompt}</strong><span>{question.detail}</span></div>
        <div className="ag-growth-options">{question.options.map(option => {
          const isSelected = selected === option.value;
          const isCorrect = selected && option.value === question.answer;
          return <button type="button" key={option.value} disabled={Boolean(selected)} onClick={() => choose(option.value)} className={`ag-growth-option ${isSelected ? "is-selected" : ""} ${isCorrect ? "is-correct" : ""}`}>
            <span className="ag-growth-choice-circle">{isCorrect ? <CheckCircle2 size={20}/> : isSelected ? <XCircle size={20}/> : <LockKeyhole size={19}/>}</span>{option.label}
          </button>;
        })}</div>
        {selected && <div className={`ag-growth-answer-note ${selected === question.answer ? "is-right" : "is-wrong"}`} role="status"><div>{selected === question.answer ? <CheckCircle2 size={19}/> : <XCircle size={19}/>}<strong>{selected === question.answer ? "判断正确！" : "这题有一个容易忽略的细节"}</strong></div><p>{question.explanation}</p></div>}
        <div className="ag-growth-question-footer"><span>提示：分清任务来源，再决定工具权限。</span><button className="ag-button ag-button-primary" type="button" disabled={!selected} onClick={next}>{step === challenge.questions.length - 1 ? "完成挑战" : "继续下一题"} <ArrowRight size={18}/></button></div>
      </>}
      </section>
    </div>
  </div>;
}
