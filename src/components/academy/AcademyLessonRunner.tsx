"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import type { AcademyLesson } from "@/data/academy";
import { AiTutor } from "@/components/academy/AiTutor";
import type { TutorTopic } from "@/lib/ai-tutor";

export function AcademyLessonRunner({ lesson }: { lesson: AcademyLesson }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [finished, setFinished] = useState(false);
  const [sync, setSync] = useState<"idle" | "saving" | "saved" | "login" | "error">("idle");
  const question = lesson.questions[index];
  const selected = answers[index];
  const correct = answers.reduce((sum, answer, i) => sum + Number(answer === lesson.questions[i].answer), 0);

  function choose(value: string) {
    if (selected !== undefined || finished) return;
    setAnswers(previous => [...previous, value]);
  }
  async function save(finalAnswers: string[]) {
    setSync("saving");
    try {
      const response = await fetch("/api/growth/lesson", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ lessonId: lesson.id, answers: finalAnswers }) });
      if (response.status === 401) { setSync("login"); return; }
      if (!response.ok) throw new Error("SAVE_FAILED");
      setSync("saved");
    } catch { setSync("error"); }
  }
  function next() {
    if (selected === undefined) return;
    if (index < lesson.questions.length - 1) setIndex(value => value + 1);
    else { setFinished(true); void save(answers); }
  }
  function restart() { setIndex(0); setAnswers([]); setFinished(false); setSync("idle"); }
  return <>
    <section className={`aga-lesson-hero aga-lesson-${lesson.accent}`}><div className="ag-wrap"><Link href="/academy" className="aga-back"><ArrowLeft size={16}/> 返回学习地图</Link><div className="aga-lesson-title"><span className="aga-lesson-emoji">{lesson.emoji}</span><div><span className="ag-overline">LESSON {lesson.number} · 互动微课</span><h1>{lesson.title}</h1><p>{lesson.subtitle}</p></div></div></div></section>
    <section className="ag-wrap aga-lesson-layout"><div className="aga-lesson-card"><div className="aga-lesson-progress"><span>{finished ? "学习完成" : `情境 ${index + 1} / ${lesson.questions.length}`}</span><div><div style={{ width: `${(finished ? lesson.questions.length : index + 1) / lesson.questions.length * 100}%` }}/></div><strong>{finished ? "100%" : `${Math.round((index + 1) / lesson.questions.length * 100)}%`}</strong></div>
      {finished ? <div className="aga-finish" role="status"><div className="aga-finish-medal">{correct >= 3 ? "🏅" : "📖"}</div><span className="ag-overline">LESSON COMPLETE</span><h2>{correct >= 3 ? "恭喜你，掌握了这节课！" : "完成学习，再练一次会更熟练"}</h2><p>答对 <strong>{correct} / {lesson.questions.length}</strong> 题。{lesson.keyIdea}</p><div className={`aga-sync aga-sync-${sync}`} aria-live="polite">{sync === "saved" ? "✓ 课程成绩已保存至个人中心" : sync === "login" ? "访客可以学习；登录后重新完成课程即可保存成绩。" : sync === "error" ? "本次练习已完成，但保存失败。请检查登录状态或数据库。" : "正在保存学习成绩…"}</div><div className="aga-finish-actions"><button type="button" className="ag-button ag-button-ghost" onClick={restart}><RotateCcw size={16}/> 再练一次</button><Link href="/academy" className="ag-button ag-button-primary">选择下一节课 <ArrowRight size={16}/></Link><Link href="/account" className="ag-button ag-button-ghost">我的成长档案</Link><Link href="/ai-tutor" className="ag-button ag-button-ghost">向 AI 助教复盘</Link></div></div> : <div className="aga-question"><span className="aga-situation">📍 {question.situation}</span><h2>{question.prompt}</h2><div className="aga-options">{question.choices.map(choice => {const answered = selected !== undefined; const isCorrect = choice.value === question.answer; const picked = selected === choice.value; return <button key={choice.value} type="button" disabled={answered} onClick={() => choose(choice.value)} className={answered && isCorrect ? "aga-option-right" : answered && picked ? "aga-option-wrong" : ""}><span className="aga-option-dot"/>{choice.label}{answered && isCorrect ? <CheckCircle2 size={19}/> : answered && picked ? <XCircle size={19}/> : <ArrowRight size={17}/>}</button>;})}</div>
      {selected !== undefined && <div className={`aga-explanation ${selected === question.answer ? "aga-explanation-right" : "aga-explanation-wrong"}`} role="status"><strong>{selected === question.answer ? "✓ 判断正确" : "看看安全规则怎么解释"}</strong><p>{question.explanation}</p><span>记住：{question.takeaway}</span><button type="button" className="ag-button ag-button-dark" onClick={next}>{index === lesson.questions.length - 1 ? "完成本课" : "下一题"} <ArrowRight size={16}/></button></div>}</div>}
    </div><aside className="aga-lesson-aside"><ShieldCheck size={32}/><span className="ag-overline">THE BIG IDEA</span><h3>本课最重要的一句话</h3><p>{lesson.keyIdea}</p><div><strong>学习小提示</strong><p>每道题选定后立即显示解析。分数由服务端重新计算，不以浏览器提交的分数为准。</p></div><Link href="/workshop">到实验工作坊验证 <ArrowRight size={16}/></Link></aside></section>
    <div className="ag-wrap aga-lesson-ai"><AiTutor topic={lesson.id as TutorTopic}/></div>
  </>;
}
