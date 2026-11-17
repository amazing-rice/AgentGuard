import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PublicShell } from "@/components/public/PublicShell";
import { AuthForm } from "@/components/auth/AuthForm";

export default function RegisterPage() {
  return (
    <PublicShell>
      <section className="ag-auth-page">
        <div className="ag-wrap ag-auth-layout">
          <div className="ag-auth-aside">
            <span className="ag-overline">JOIN THE INVESTIGATION</span>
            <h1>成为安全侦探，<br /><span>从今天开始。</span></h1>
            <p>创建账号后，你的学习成果将逐步保存在个人档案中。注册只需要昵称、邮箱和密码。</p>
            <div className="ag-auth-aside-points"><span>✓ 普通用户免费注册</span><span>✓ 不要求填写真实身份信息</span><span>✓ 密码安全哈希存储</span></div>
            <Link href="/" className="ag-text-arrow"><ArrowLeft size={16} /> 返回首页</Link>
          </div>
          <AuthForm mode="register" />
        </div>
      </section>
    </PublicShell>
  );
}
