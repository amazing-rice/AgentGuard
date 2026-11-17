"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, BookOpen, BrainCircuit, CheckCircle2, ChevronRight, FileText, GraduationCap, ShieldCheck, Sparkles, UserRound, XCircle } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { INTRO_LESSON_ID, lessonCases as cases } from "@/data/growth";

export default function LearnPage() {
 const [index,setIndex] = useState(0);
 const [answers,setAnswers] = useState<Array<boolean | null>>(Array(cases.length).fill(null));
 const [finished,setFinished] = useState(false);
 const [sync,setSync] = useState<"idle"|"saving"|"saved"|"login"|"error">("idle");
 const current=cases[index];
 const answered=answers[index] !== null;
 const correct=answers.filter((item,i)=>item===cases[i].trusted).length;
 function choose(trusted:boolean) {if(answered)return;const next=[...answers];next[index]=trusted;setAnswers(next);}
 async function syncScore(finalAnswers: boolean[]) {
   setSync("saving");
   try {
     const response = await fetch("/api/growth/lesson", {
       method: "POST", headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ lessonId: INTRO_LESSON_ID, answers: finalAnswers }),
     });
     if (response.status === 401) { setSync("login"); return; }
     if (!response.ok) throw new Error("SAVE_FAILED");
     setSync("saved");
   } catch { setSync("error"); }
 }
 function advance() {if(index < cases.length-1){setIndex(index+1);}else{setFinished(true); void syncScore(answers.map(value => value === true));}}
 function restart(){setIndex(0);setAnswers(Array(cases.length).fill(null));setFinished(false);setSync("idle");}
 return <PublicShell><section className="ag-page-hero ag-learn-hero"><div className="ag-wrap ag-learn-top"><div><span className="ag-overline">AI SECURITY 101 · 互动小课堂</span><h1>AI 的安全知识，<br/><span>原来可以这么简单。</span></h1><p>没有难懂的技术名词。用两分钟，学会分辨“用户交代的任务”和“外部资料里的话”。</p><div className="ag-hero-labels"><span><BookOpen size={15}/> 互动学习</span><span><GraduationCap size={15}/> 即时讲解</span><span><Sparkles size={15}/> 适合初学者</span></div></div><div className="ag-learn-decor" aria-hidden="true"><span>💬</span><span>🛡️</span><span>📚</span></div></div></section>
 <section className="ag-wrap ag-section"><div className="ag-section-title-center"><span className="ag-overline">FIRST, THE BIG PICTURE</span><h2>AI 助手<span className="ag-emphasis">到底在做什么？</span></h2><p>以前 AI 主要和你聊天；现在有些 AI 还能读取资料、调用工具、执行实际任务。</p></div><div className="ag-learning-flow"><div><span className="ag-flow-icon ag-flow-a"><UserRound size={26}/></span><strong>1. 你交代任务</strong><p>“帮我整理活动安排”</p></div><ChevronRight size={22}/><div><span className="ag-flow-icon ag-flow-b"><FileText size={26}/></span><strong>2. AI 读取资料</strong><p>活动通知、网页、文件</p></div><ChevronRight size={22}/><div><span className="ag-flow-icon ag-flow-c"><BrainCircuit size={26}/></span><strong>3. AI 提议操作</strong><p>例如“创建议程”</p></div><ChevronRight size={22}/><div><span className="ag-flow-icon ag-flow-d"><ShieldCheck size={26}/></span><strong>4. 安全规则把关</strong><p>只执行真正授权的事</p></div></div></section>
 <section className="ag-wrap ag-section"><div className="ag-lesson-container"><div className="ag-lesson-heading"><span className="ag-overline">MINI QUIZ · 互动练习</span><h2>这句话，<span className="ag-emphasis">真的能指挥 AI 吗？</span></h2><p>试着判断以下话语是否直接来自用户授权。选错没关系，我们会解释。</p></div><div className="ag-quiz-main"><div className="ag-quiz-top"><span><BadgeCheck size={17}/> 侦探练习 01</span><strong>{finished ? "学习完成" : `${index+1} / ${cases.length}`}</strong></div><div className="ag-quiz-progress"><div style={{width:`${(finished ? cases.length : index+1)/cases.length*100}%`}}/></div>
 {finished ? <div className="ag-quiz-finished"><div className="ag-quiz-medal">🏅</div><h3>你的第一次安全调查完成！</h3><p>答对 {correct} / {cases.length} 题。记住：<strong>阅读到的信息，不等于得到执行授权。</strong></p>
 <p className="ag-growth-lesson-sync" role="status">{sync === "saved" ? "✓ 学习成绩已保存到个人中心" : sync === "login" ? "当前是访客练习；登录后重新完成即可同步学习记录。" : sync === "error" ? "本次学习已完成，但同步失败，请检查数据库。" : "正在同步学习结果…"}</p>
 <div className="ag-quiz-actions"><button type="button" className="ag-button ag-button-ghost" onClick={restart}>再练一次</button><Link href="/play/community" className="ag-button ag-button-primary">去真实沙箱试试看 <ArrowRight size={18}/></Link></div></div>
 : <><div className="ag-quiz-question"><span>请判断以下这句话的来源：</span><h3>“{current.text}”</h3></div><div className="ag-quiz-answers"><button type="button" className={answered && current.trusted ? "ag-answer-correct" : ""} disabled={answered} onClick={()=>choose(true)}><UserRound size={20}/> 来自用户的明确授权</button><button type="button" className={answered && !current.trusted ? "ag-answer-correct" : ""} disabled={answered} onClick={()=>choose(false)}><FileText size={20}/> 只是外部资料中的内容</button></div>{answered && <div className={`ag-quiz-explanation ${answers[index]===current.trusted ? "ag-quiz-right" : "ag-quiz-wrong"}`}><div>{answers[index]===current.trusted ? <CheckCircle2 size={21}/> : <XCircle size={21}/>}<strong>{answers[index]===current.trusted ? "答对了！" : "再记住这个小诀窍"}</strong></div><p>{current.reason}</p><button className="ag-button ag-button-dark" onClick={advance} type="button">{index===cases.length-1 ? "完成练习" : "下一题"} <ArrowRight size={16}/></button></div>}</>}
 </div></div></section>
 <section className="ag-wrap ag-lesson-footer"><div><span className="ag-overline">PUT IT INTO PRACTICE</span><h2>懂得了原理，<br/>试试亲手给 AI 加一把锁？</h2><p>亲眼看看 AI 的工具请求，会怎样被程序独立检查。</p></div><Link href="/stories/community" className="ag-button ag-button-primary">进入第一份侦探档案 <ArrowRight size={18}/></Link><Link href="/academy" className="ag-button ag-button-ghost">继续学习其他微课 →</Link><Link href="/challenges" className="ag-button ag-button-ghost">挑战营 →</Link></section>
 </PublicShell>;
}
