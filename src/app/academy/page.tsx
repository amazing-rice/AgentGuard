import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, GraduationCap, LockKeyhole, Sparkles } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { academyLessons } from "@/data/academy";
import { AiTutor } from "@/components/academy/AiTutor";

export default function AcademyPage() {
  return <PublicShell>
    <section className="aga-hero"><div className="ag-wrap aga-hero-inner"><div><span className="ag-overline">AGENTGUARD ACADEMY · 系统学习</span><h1>四堂微课，<br/><span>建立你的 AI 安全直觉。</span></h1><p>从识别可信指令，到最小权限、外部资料、操作审计。每节课都有生活情境和即时反馈，还能向实时 DeepSeek 安全助教提问；登录后可保存课程最高分。</p><div className="aga-hero-tags"><span><BookOpen size={16}/> 4 门微课程</span><span><GraduationCap size={16}/> 每节约 3–4 分钟</span><span><LockKeyhole size={16}/> 无需提供个人资料</span></div></div><div className="aga-hero-art" aria-hidden="true"><span>📚</span><strong>LEARN · PRACTICE<br/>PROTECT</strong><span>🛡️</span></div></div></section>
    <section className="ag-wrap aga-ai-feature"><AiTutor/></section>
    <section className="ag-wrap aga-content"><div className="aga-section-head"><div><span className="ag-overline">YOUR LEARNING PATH</span><h2>从第一课开始，逐步解锁安全思维</h2><p>课程按建议顺序排列，但你可以自由选择；没有强制锁定。</p></div><Link href="/account" className="aga-my-progress">我的学习记录 <ArrowRight size={16}/></Link></div>
      <div className="aga-course-grid">
        <Link href="/learn" className="aga-course aga-course-blue"><div className="aga-course-top"><span className="aga-course-emoji">💬</span><span>LESSON 01</span></div><h3>认识可信指令</h3><p>分辨用户授权与外部资料，理解 AI 为什么需要一条清晰的信任边界。</p><div className="aga-course-footer"><span><CheckCircle2 size={15}/> 4 道判断题 · 3 分钟</span><strong>开始学习 <ArrowRight size={16}/></strong></div></Link>
        {Object.values(academyLessons).map(lesson => <Link href={`/academy/${lesson.id}`} key={lesson.id} className={`aga-course aga-course-${lesson.accent}`}><div className="aga-course-top"><span className="aga-course-emoji">{lesson.emoji}</span><span>LESSON {lesson.number}</span></div><h3>{lesson.title}</h3><p>{lesson.subtitle}</p><div className="aga-course-footer"><span><CheckCircle2 size={15}/> {lesson.questions.length} 道情境题 · {lesson.minutes} 分钟</span><strong>开始学习 <ArrowRight size={16}/></strong></div></Link>)}
      </div>
      <div className="aga-after-course"><div><Sparkles size={23}/><div><strong>学会了知识，马上试试真实操作的区别</strong><p>在安全挑战营判断权限，在指令工作坊亲手验证安全规则。</p></div></div><div><Link href="/challenges" className="ag-button ag-button-ghost">去挑战营</Link><Link href="/ai-tutor" className="ag-button ag-button-ghost">问问 AI 助教 <Sparkles size={16}/></Link><Link href="/workshop" className="ag-button ag-button-primary">去工作坊 <ArrowRight size={16}/></Link></div></div>
    </section>
  </PublicShell>;
}
