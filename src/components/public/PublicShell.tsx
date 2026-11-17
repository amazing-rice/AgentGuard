import Link from "next/link";
import type { ReactNode } from "react";
import { AccountNav } from "@/components/public/AccountNav";
import { ArrowUpRight, BookOpen, FlaskConical, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";

const navigation = [
  { label: "首页", href: "/" },
  { label: "安全故事馆", href: "/stories" },
  { label: "学习地图", href: "/academy" },
  { label: "AI 安全助教", href: "/ai-tutor" },
  { label: "安全体检", href: "/checkup" },
  { label: "工作坊", href: "/workshop" },
  { label: "挑战营", href: "/challenges" },
];

export function BrandMark() {
  return (
    <span className="ag-brand-mark" aria-hidden="true">
      <ShieldCheck size={24} strokeWidth={2.6} />
    </span>
  );
}

export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="ag-public">
      <div className="ag-announcement">
        <Sparkles size={14} aria-hidden="true" />
        <span>欢迎来到 AI 安全侦探社 · 用生活故事发现 AI 的安全秘密</span>
        <Sparkles size={14} aria-hidden="true" />
      </div>
      <header className="ag-header">
        <div className="ag-wrap ag-header-inner">
          <Link className="ag-brand" href="/" aria-label="AgentGuard 首页">
            <BrandMark />
            <span>Agent<span className="ag-brand-accent">Guard</span><small>AI 安全侦探社</small></span>
          </Link>
          <nav className="ag-main-nav" aria-label="主要导航">
            {navigation.map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}
          </nav>
          <Link className="ag-header-cta" href="/play/community"><FlaskConical size={17} /> 进入互动实验 <ArrowUpRight size={17}/></Link>
          <AccountNav />
          <details className="ag-mobile-menu">
            <summary aria-label="展开导航">☰ 菜单</summary>
            <nav aria-label="移动端导航">
              {navigation.map(item => <Link key={item.href} href={item.href}>{item.label}</Link>)}
              <Link href="/play/community">开始安全实验</Link>
              <Link href="/workshop">自定义指令工作坊</Link>
              <Link href="/login">登录</Link>
              <Link href="/register">免费注册</Link>
              <Link href="/account">个人中心</Link>
              <Link href="/lab">开发者实验室</Link>
            </nav>
          </details>
        </div>
      </header>
      <main id="ag-main">{children}</main>
      <footer className="ag-footer">
        <div className="ag-wrap ag-footer-grid">
          <div>
            <Link className="ag-brand ag-footer-brand" href="/"><BrandMark/><span>Agent<span className="ag-brand-accent">Guard</span><small>让 AI 安全变得看得懂、学得会</small></span></Link>
            <p>通过真实沙箱实验与生活化互动，认识智能体的能力边界。所有演示使用虚构数据。</p>
          </div>
          <div className="ag-footer-links"><strong>开始探索</strong><Link href="/stories"><FlaskConical size={15}/> 故事馆</Link><Link href="/academy"><BookOpen size={15}/> 学习地图</Link><Link href="/checkup"><HeartHandshake size={15}/> 安全体检</Link><Link href="/challenges">🏆 挑战营</Link><Link href="/workshop">✍️ 指令工作坊</Link><Link href="/ai-tutor">🤖 AI 安全助教</Link><Link href="/account">👤 个人成长</Link></div>
          <div className="ag-footer-links"><strong>技术与说明</strong><Link href="/lab">专业实验室</Link><Link href="/reports">实验审计记录</Link><Link href="/about">平台架构</Link></div>
        </div>
        <div className="ag-wrap ag-footer-bottom"><span>© AgentGuard · AI 安全互动科普</span><span>科普演示不等于对真实产品的安全检测</span></div>
      </footer>
    </div>
  );
}
