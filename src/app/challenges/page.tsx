import Link from "next/link";
import { ArrowRight, BookOpen, Compass, ShieldCheck, Trophy } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { challenges } from "@/data/growth";

export default function ChallengesPage() {
  return <PublicShell>
    <section className="ag-growth-hero ag-growth-hero-challenges">
      <div className="ag-wrap ag-growth-hero-grid">
        <div><span className="ag-overline">DETECTIVE ACADEMY · 安全挑战营</span><h1>成为保护 AI 的<br/><span>安全侦探！</span></h1><p>不是枯燥的考试，而是两项可以动手完成的安全任务。找到隐藏指令、配置工具权限，完成后把成绩写进你的个人成长档案。</p>
        <div className="ag-growth-hero-actions"><Link className="ag-button ag-button-primary" href="/challenges/find-hidden-instruction">领取第一张挑战卡 <ArrowRight size={18}/></Link><Link className="ag-button ag-button-ghost" href="/account">查看我的成长</Link></div></div>
        <div className="ag-growth-hero-art" aria-hidden="true"><span className="ag-growth-orbit">✦</span><span>🔍</span><strong>MISSION<br/>ACCEPTED!</strong><span className="ag-growth-orbit-b">⭐</span></div>
      </div>
    </section>
    <section className="ag-wrap ag-section"><div className="ag-section-heading"><div><span className="ag-overline">CHALLENGE MAP</span><h2>今天有 <span className="ag-emphasis">2 张任务卡</span> 等你解锁</h2><p>你可以不登录直接练习；登录后成绩自动保存，刷新和换设备仍可查看。</p></div></div>
      <div className="ag-growth-challenge-grid">{Object.values(challenges).map(challenge => <Link className={`ag-growth-challenge-card ag-growth-${challenge.theme}`} href={`/challenges/${challenge.id}`} key={challenge.id}>
        <div className="ag-growth-challenge-top"><span>CASE #{challenge.number}</span><span>{challenge.estimatedMinutes} 分钟</span></div>
        <span className="ag-growth-emoji">{challenge.emoji}</span><span className="ag-growth-eyebrow">{challenge.eyebrow}</span><h3>{challenge.title}</h3><p>{challenge.subtitle}</p><span className="ag-growth-go">开始挑战 <ArrowRight size={18}/></span>
      </Link>)}</div>
    </section>
    <section className="ag-wrap ag-growth-explain"><div><Trophy size={32}/><strong>答题有解释</strong><p>每次判断都告诉你为什么。</p></div><div><ShieldCheck size={32}/><strong>学习真实权限原则</strong><p>理解哪些操作需要单独授权。</p></div><div><BookOpen size={32}/><strong>成绩自动归档</strong><p>登录后查看最高分和挑战次数。</p></div></section>
    <section className="ag-wrap ag-growth-last"><span><Compass size={22}/> 玩完挑战，想看 AI 真的怎么行动？</span><Link href="/play/community">去做安全实验 <ArrowRight size={18}/></Link></section>
  </PublicShell>;
}
