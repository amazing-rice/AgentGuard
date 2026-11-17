import Link from "next/link";
import { ArrowUpRight, Clock3, LockKeyhole, Sparkles } from "lucide-react";
import { StoryArt } from "@/components/public/Illustrations";
import type { StoryKind } from "@/components/public/Illustrations";
import type { stories } from "@/data/publicStories";

type Story = (typeof stories)[number];

export function StoryCard({ story }: { story: Story }) {
  return (
    <article className={`ag-story-card ag-story-${story.color}`}>
      <div className="ag-story-art-wrap"><StoryArt kind={story.id as StoryKind}/><span className="ag-story-index">{story.chapter}</span></div>
      <div className="ag-story-card-body">
        <div className="ag-story-meta"><span><Clock3 size={14}/>{story.time}</span><span>{story.level}</span></div>
        <h3>{story.title}</h3>
        <p>{story.summary}</p>
        <div className="ag-story-card-bottom"><span className="ag-chip"><Sparkles size={13}/>{story.topic}</span>{story.ready ? <Link href={`/stories/${story.id}`} className="ag-round-arrow" aria-label={`了解${story.title}`}><ArrowUpRight size={23}/></Link> : <span className="ag-story-locked" title="内容正在规划中"><LockKeyhole size={17}/></span>}</div>
        {story.ready ? <Link href={`/stories/${story.id}`} className="ag-story-text-link">阅读故事并开始实验 <ArrowUpRight size={15}/></Link> : <span className="ag-story-text-link ag-disabled">这是下一阶段的开发计划，暂不可体验</span>}
      </div>
    </article>
  );
}
