import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, ArrowUpRight, ShieldCheck, Users } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect("/login");
  if (currentUser.role !== "ADMIN") redirect("/account");

  const now = new Date();
  const [userCount, activeSessionCount, recentUsers, lessonRecords, challengeRecords, experimentRecords] = await Promise.all([
    prisma.user.count(),
    prisma.session.count({ where: { expiresAt: { gt: now } } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    }),
    prisma.lessonProgress.count(),
    prisma.challengeProgress.count(),
    prisma.experimentRecord.count(),
  ]);

  return (
    <PublicShell>
      <section className="ag-admin-page">
        <div className="ag-wrap">
          <div className="ag-admin-heading">
            <div><span className="ag-overline">AGENTGUARD ADMINISTRATION</span><h1>平台管理后台</h1><p>管理账号基础信息，查看当前注册与登录会话概况。</p></div>
            <span className="ag-admin-secure"><ShieldCheck size={17} /> 管理员权限已验证</span>
          </div>

          <div className="ag-admin-stats">
            <article><span className="ag-admin-stat-icon"><Users size={22} /></span><small>注册用户</small><strong>{userCount}</strong><span>当前数据库账号总数</span></article>
            <article><span className="ag-admin-stat-icon ag-admin-stat-blue"><Activity size={22} /></span><small>有效登录会话</small><strong>{activeSessionCount}</strong><span>尚未过期的登录状态</span></article>
            <article><span className="ag-admin-stat-icon ag-admin-stat-orange"><ShieldCheck size={22} /></span><small>当前管理员</small><strong>{currentUser.name}</strong><span>当前登录账户</span></article>
          </div>

          <section className="ag-growth-admin-pulse" aria-label="学习与实验数据概览">
            <div><strong>{lessonRecords}</strong><span>学习进度条目</span></div>
            <div><strong>{challengeRecords}</strong><span>挑战成绩条目</span></div>
            <div><strong>{experimentRecords}</strong><span>已归档的模拟实验</span></div>
          </section>

          <section className="ag-admin-table-card">
            <div className="ag-admin-table-heading"><div><h2>最近注册的用户</h2><p>只展示账户基础资料，不展示密码或会话令牌。</p></div><span>{recentUsers.length} 条记录</span></div>
            <div className="ag-admin-table-scroll"><table className="ag-admin-table"><thead><tr><th>用户</th><th>邮箱</th><th>角色</th><th>注册时间</th></tr></thead><tbody>
              {recentUsers.map((user) => <tr key={user.id}><td><strong>{user.name}</strong></td><td>{user.email}</td><td><span className={user.role === "ADMIN" ? "ag-role-admin" : "ag-role-user"}>{user.role === "ADMIN" ? "管理员" : "普通用户"}</span></td><td>{new Intl.DateTimeFormat("zh-CN", { dateStyle: "medium" }).format(user.createdAt)}</td></tr>)}
              {recentUsers.length === 0 ? <tr><td colSpan={4}>暂无注册用户</td></tr> : null}
            </tbody></table></div>
          </section>

          <div className="ag-admin-next"><div><strong>下一阶段管理能力</strong><p>学习进度、挑战成绩和实验总量已接入数据库。本阶段仅展示汇总数据，个人记录仅本人可查看。</p></div><Link href="/lab">打开专业实验室 <ArrowUpRight size={16} /></Link></div>
        </div>
      </section>
    </PublicShell>
  );
}
