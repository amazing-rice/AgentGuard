import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, FlaskConical, Medal, ShieldCheck, Sparkles, Trophy, UserRound } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { challenges, INTRO_LESSON_ID, lessonCases } from "@/data/growth";
import { academyLessons } from "@/data/academy";
import { isStoryId, STORY_LAB } from "@/data/storyLab";

export const dynamic = "force-dynamic";

const date = (input: Date) => new Intl.DateTimeFormat("zh-CN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(input);

function historyStoryName(json: string): string {
  try {
    const value: unknown = JSON.parse(json);
    if (value && typeof value === "object" && "storyId" in value) {
      const id = (value as { storyId?: unknown }).storyId;
      if (typeof id === "string" && isStoryId(id)) return STORY_LAB[id].title;
    }
  } catch { /* 数据库已有的历史记录可能是早期格式 */ }
  return "社区活动安全实验";
}

function isWorkshopHistory(json: string): boolean {
  try {
    const data: unknown = JSON.parse(json);
    return Boolean(data && typeof data === "object" && "customDocumentInfo" in data);
  } catch { return false; }
}

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const [lessonsDone, challengesDone, recentRuns, experimentCount] = await Promise.all([
    prisma.lessonProgress.findMany({ where: { userId: user.id } }),
    prisma.challengeProgress.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } }),
    prisma.experimentRecord.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.experimentRecord.count({ where: { userId: user.id } }),
  ]);
  const introLesson = lessonsDone.find(record => record.lessonId === INTRO_LESSON_ID);
  const lessonComplete = (introLesson?.bestScore ?? 0) >= 3;
  const academyCompleted = Object.values(academyLessons).filter(definition =>
    (lessonsDone.find(record => record.lessonId === definition.id)?.bestScore ?? 0) >= 3,
  ).length;
  const completedLessons = Number(lessonComplete) + academyCompleted;
  const totalLessons = 1 + Object.keys(academyLessons).length;
  const finishedChallenges = challengesDone.filter(record => record.bestScore >= 4).length;
  const completedMissions = completedLessons + finishedChallenges;
  const maxMissions = totalLessons + Object.keys(challenges).length;
  const joinedDate = new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric" }).format(user.createdAt);
  const badges = [
    { emoji: "📖", title: "初识 AI 安全", unlocked: lessonComplete, detail: "完成安全小课堂" },
    { emoji: "🔬", title: "沙箱观察员", unlocked: experimentCount > 0, detail: "完成一次安全实验" },
    { emoji: "🔍", title: "见习侦探", unlocked: finishedChallenges > 0, detail: "通过至少一个挑战" },
    { emoji: "🏆", title: "安全守护者", unlocked: finishedChallenges === 2, detail: "通过两项挑战" },
    { emoji: "🧠", title: "持续学习者", unlocked: completedLessons >= 2, detail: "通过任意两门课程" },
    { emoji: "🎓", title: "AI 安全毕业生", unlocked: completedLessons === totalLessons, detail: "通过全部四门课程" },
  ];
  const badgeCount = badges.filter(badge => badge.unlocked).length;
  return <PublicShell>
    <section className="ag-growth-account-hero"><div className="ag-wrap ag-growth-account-heading"><div>
      <span className="ag-overline">MY DETECTIVE JOURNEY · 我的成长档案</span><h1>欢迎回来，<span>{user.name}</span>！</h1><p>每一堂课、每一关挑战、每一次模拟实验，都会成为你安全探索之路上的新发现。</p>
      <div className="ag-growth-profile-meta"><span><UserRound size={16}/> {user.role === "ADMIN" ? "管理员 · 安全侦探" : "安全侦探"}</span><span><CalendarDays size={16}/> {joinedDate} 加入</span></div>
      </div><div className="ag-growth-account-avatar" aria-hidden="true"><span>🛡️</span><small>AGENTGUARD DETECTIVE</small></div>
    </div></section>
    <section className="ag-wrap ag-growth-account-content">
      <div className="ag-growth-stats">
        <article><span className="ag-growth-stat-icon">📚</span><small>已完成课程</small><strong>{completedLessons}<em> / {totalLessons}</em></strong><span>互动微课最高成绩达标</span></article>
        <article><span className="ag-growth-stat-icon">🎯</span><small>已通过挑战</small><strong>{finishedChallenges}<em> / 2</em></strong><span>正确率达到关卡要求</span></article>
        <article><span className="ag-growth-stat-icon">🧪</span><small>实验记录</small><strong>{experimentCount}</strong><span>本账号的虚构沙箱实验</span></article>
        <article><span className="ag-growth-stat-icon">🏅</span><small>已获得徽章</small><strong>{badgeCount}<em> / {badges.length}</em></strong><span>继续学习解锁奖励</span></article>
      </div>
      <div className="ag-growth-account-columns">
        <section className="ag-growth-panel ag-growth-path-panel"><div className="ag-growth-panel-head"><div><span className="ag-overline">KEEP EXPLORING</span><h2>你的安全学习地图</h2></div><Medal size={29}/></div>
          <p>已达成 {completedMissions} / {maxMissions} 项学习目标。每完成一项就能点亮新的成长记录。</p>
          <div className="ag-growth-bigprogress"><div style={{ width: `${completedMissions / maxMissions * 100}%` }}/></div>
          <div className="ag-growth-mission-list">
            <Link href="/learn"><span className="ag-growth-mission-icon">📖</span><span><strong>认识可信指令</strong><small>{introLesson ? `最高 ${introLesson.bestScore}/${lessonCases.length} 分 · 完成 ${introLesson.attempts} 次` : "用图解和测验认识 AI 的安全边界"}</small></span><span className="ag-growth-mission-state">{lessonComplete ? "✓ 已达标" : "去学习 →"}</span></Link>
            {Object.values(academyLessons).map(definition => {
              const record = lessonsDone.find(item => item.lessonId === definition.id);
              return <Link href={`/academy/${definition.id}`} key={definition.id}><span className="ag-growth-mission-icon">{definition.emoji}</span><span><strong>{definition.title}</strong><small>{record ? `最高 ${record.bestScore}/${definition.questions.length} 分 · 完成 ${record.attempts} 次` : definition.subtitle}</small></span><span className="ag-growth-mission-state">{record && record.bestScore >= 3 ? "✓ 已达标" : "去学习 →"}</span></Link>;
            })}
            {Object.values(challenges).map(challenge => {
              const record = challengesDone.find(item => item.challengeId === challenge.id);
              return <Link href={`/challenges/${challenge.id}`} key={challenge.id}><span className="ag-growth-mission-icon">{challenge.emoji}</span><span><strong>{challenge.title}</strong><small>{record ? `最高 ${record.bestScore}/${challenge.questions.length} 分 · 挑战 ${record.attempts} 次` : challenge.subtitle}</small></span><span className="ag-growth-mission-state">{record && record.bestScore >= 4 ? "✓ 已达标" : "去挑战 →"}</span></Link>;
            })}
          </div>
        </section>
        <section className="ag-growth-panel ag-growth-badges-panel"><div className="ag-growth-panel-head"><div><span className="ag-overline">YOUR COLLECTION</span><h2>安全侦探荣誉墙</h2></div><Trophy size={29}/></div>
          <div className="ag-growth-badges-grid">{badges.map(badge => <div key={badge.title} className={badge.unlocked ? "ag-growth-badge unlocked" : "ag-growth-badge locked"}><span aria-hidden="true">{badge.unlocked ? badge.emoji : "🔒"}</span><strong>{badge.title}</strong><small>{badge.unlocked ? "已解锁" : badge.detail}</small></div>)}</div>
          <p className="ag-growth-badges-tip"><Sparkles size={17}/> 徽章由真实学习、挑战和实验记录计算，不会预先发放。</p>
        </section>
      </div>
      <section className="ag-growth-panel ag-growth-history-panel"><div className="ag-growth-panel-head"><div><span className="ag-overline">MY AI LAB REPORTS</span><h2>我的安全实验历史</h2></div><FlaskConical size={28}/></div>
        {recentRuns.length ? <div className="ag-growth-history-list">{recentRuns.map(run => <div key={run.runId} className="ag-growth-history-row"><span className="ag-growth-history-mark">{run.mode === "guarded" ? "🛡️" : "🧪"}</span><div><strong>{historyStoryName(run.runJson)} · {run.mode === "guarded" ? "开启保护" : "不加保护"} · {isWorkshopHistory(run.runJson) ? "自定义资料" : run.variant === "injected" ? "含隐藏指令" : "正常资料"}</strong><small>{run.source === "fixture" ? "教学脚本回放" : "DeepSeek 实时模型"} · {date(run.createdAt)} · {run.status === "completed" ? "已结束" : "未完整结束"}</small></div><span className="ag-growth-history-blocks">阻断 {run.blocked} 次</span><a href={`/api/export?id=${encodeURIComponent(run.runId)}&format=md`} className="ag-growth-history-download" title="下载本人的审计记录">下载报告 <ArrowRight size={15}/></a></div>)}</div> : <div className="ag-growth-empty"><FlaskConical size={34}/><h3>还没有属于你的实验记录</h3><p>去互动实验室做一次模拟对照。登录状态下完成的实验会自动归档在这里。</p><Link href="/play/community" className="ag-button ag-button-primary">开始第一份实验 <ArrowRight size={16}/></Link></div>}
      </section>
      <section className="ag-growth-account-footer"><div><h2>继续探索，就会有新收获 ✨</h2><p>四门课程、两项挑战和模拟实验会形成你的成长档案；实验记录只对当前登录账号开放。</p></div><div className="ag-growth-actions"><Link className="ag-button ag-button-primary" href="/academy">学习地图 <ArrowRight size={17}/></Link><Link className="ag-button ag-button-ghost" href="/challenges">挑战营</Link><Link className="ag-button ag-button-ghost" href="/stories">故事馆</Link>{user.role === "ADMIN" ? <Link className="ag-button ag-button-dark" href="/admin">管理员后台</Link> : null}<LogoutButton /></div></section>
      <p className="ag-growth-private-note"><ShieldCheck size={16}/> 当前采用 SQLite 本地数据库保存账号关联记录；旧版未关联用户的 runs.json 仍保留在本机，但不会自动显示在个人档案里。</p>
    </section>
  </PublicShell>;
}
