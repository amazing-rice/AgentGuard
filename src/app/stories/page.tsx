import Link from "next/link";
import { ArrowRight, BookOpen, ShieldCheck, Sparkles } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { StoryCard } from "@/components/stories/StoryCard";
import { stories } from "@/data/publicStories";

export default function StoriesPage(){
 return <PublicShell>
  <section className="ag-page-hero ag-stories-hero"><div className="ag-wrap ag-story-hero-inner"><div><span className="ag-overline">THE STORY COLLECTION · 安全故事馆</span><h1>安全知识，<br/><span>藏在每一个生活故事里。</span></h1><p>让 AI 帮你整理活动、安排旅行、处理笔记。原本普通的小事，可能因为一段隐藏的文字而发生变化。</p><div className="ag-hero-labels"><span><Sparkles size={15}/> 场景化体验</span><span><ShieldCheck size={15}/> 真实沙箱执行</span><span><BookOpen size={15}/> 零基础可学</span></div></div><div className="ag-story-hero-sticker" aria-hidden="true"><span>📂</span><span>🔎</span><strong>CASE FILES</strong></div></div></section>
  <section className="ag-wrap ag-section"><div className="ag-section-heading"><div><span className="ag-overline">CHOOSE YOUR ADVENTURE</span><h2>挑选一份<span className="ag-emphasis">侦探档案</span></h2><p>四个生活故事均可互动，选择离线教学回放无需登录；还可以体验真实模型的工具调用。</p></div><div className="ag-story-count">04 <span>/ 04 个故事已开放</span></div></div><div className="ag-story-grid">{stories.map(story=><StoryCard story={story} key={story.id}/>)}</div></section>
  <section className="ag-wrap ag-stories-explainer"><div className="ag-icon-bubble"><ShieldCheck size={30}/></div><div><h3>为什么叫“安全故事”？</h3><p>每个故事都给 AI 一个明确任务，再加入一段可能误导它的外部资料。你可以亲自观察 AI 提出什么操作，以及安全规则是否允许执行。所有模拟数据均为虚构，不接触真实人员信息。</p></div><div style={{display:"flex",flexWrap:"wrap",gap:10}}><Link className="ag-button ag-button-dark" href="/stories/community">从第一案开始 <ArrowRight size={17}/></Link><Link className="ag-button ag-button-primary" href="/workshop">自己编写实验 <ArrowRight size={17}/></Link></div></section>
 </PublicShell>;
}
