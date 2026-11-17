import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { AuthForm } from "@/components/auth/AuthForm";

export default function LoginPage() {
  return (
    <PublicShell>
      <section className="ag-auth-page">
        <div className="ag-wrap ag-auth-layout">
          <div className="ag-auth-aside">
            <span className="ag-overline">YOUR SAFE AI JOURNEY</span>
            <h1>每一次探索，<br /><span>都值得被记录。</span></h1>
            <p>登录后可以逐步积累你的课程进度、实验历史、挑战成绩与个人徽章。</p>
            <div className="ag-auth-aside-points"><span>✓ 保存学习进度</span><span>✓ 回看安全实验</span><span>✓ 记录挑战成果</span></div>
            <Link href="/" className="ag-text-arrow"><ArrowLeft size={16} /> 返回首页</Link>
          </div>
          <AuthForm mode="login" />
        </div>
      </section>
    </PublicShell>
  );
}
