import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ShieldCheck, BookOpen, LockKeyhole } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { STORY_LAB, isStoryId } from "@/data/storyLab";

export default async function StoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isStoryId(id)) notFound();
  const story = STORY_LAB[id];
  return <PublicShell><div className={`agv-world agv-world-${id}`}>
    <div className="ag-wrap agv-breadcrumb"><Link href="/stories"><ArrowLeft size={16}/> 返回故事馆</Link><span>›</span>{story.title}</div>
    <section className="ag-wrap agv-detail-cover"><div><span className="agv-eyebrow">DETECTIVE CASE FILE #{story.chapter}</span><h1>{story.title}</h1><p>{story.subTitle}</p><div className="agv-hero-tags"><span>{story.tag}</span><span>适合零基础</span><span>模拟体验约 3 分钟</span></div><Link className="agv-start agv-start-link" href={`/play/${id}`}>进入故事，开始调查 <ArrowRight size={20}/></Link></div><div className="agv-detail-art">{id === "travel" ? "🧳" : id === "study" ? "📖" : "✉️"}<span>CASE {story.chapter}</span></div></section>
    <section className="ag-wrap agv-detail-grid"><article><span className="agv-detail-icon"><BookOpen size={25}/></span><h2>你希望 AI 做什么？</h2><p>{story.task}</p><strong>正常情况下，它应该完成这项工作。</strong></article><article><span className="agv-detail-icon"><LockKeyhole size={25}/></span><h2>资料里可能藏着什么？</h2><p>外部资料里可能混入了额外的操作指令。它们并不是你亲自下达的任务。</p><strong>涉及风险：{story.sensitiveLabel}</strong></article><article><span className="agv-detail-icon"><ShieldCheck size={25}/></span><h2>你要亲自验证什么？</h2><p>运行“无保护”和“有保护”两轮实验，对照 AI 的操作请求和沙箱中的实际结果。</p><strong>全程只使用虚构数据。</strong></article></section>
    <div className="ag-wrap agv-detail-action"><h2>准备好揭晓真相了吗？</h2><p>只需要点击开始，不懂编程也能完成一次安全实验。</p><Link className="agv-start agv-start-link" href={`/play/${id}`}>开始这次调查 <ArrowRight size={19}/></Link></div>
  </div></PublicShell>;
}
