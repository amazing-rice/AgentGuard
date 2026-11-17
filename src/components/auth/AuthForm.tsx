"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, LoaderCircle, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";

type AuthFormProps = {
  mode: "login" | "register";
};

type ApiError = {
  message?: string;
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (isRegister && password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(isRegister ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isRegister
          ? { name, email, password, confirmPassword }
          : { email, password }),
      });
      const result = await response.json() as ApiError;

      if (!response.ok) {
        setError(result.message ?? "操作失败，请稍后重试");
        return;
      }

      router.push("/account");
      router.refresh();
    } catch {
      setError("暂时无法连接服务器，请检查开发服务是否正常运行");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ag-auth-card">
      <div className="ag-auth-card-heading">
        <span className="ag-auth-icon"><ShieldCheck size={27} /></span>
        <span className="ag-overline">AGENTGUARD ACCOUNT</span>
        <h2>{isRegister ? "创建你的侦探档案" : "欢迎回来"}</h2>
        <p>{isRegister ? "保存你的学习进度、实验记录和挑战成果。" : "登录后继续你的 AI 安全探索之旅。"}</p>
      </div>

      <form className="ag-auth-form" onSubmit={submit}>
        {isRegister && (
          <label className="ag-auth-field">
            <span>昵称</span>
            <span className="ag-auth-input-wrap"><UserRound size={18} /><input value={name} onChange={(event) => setName(event.target.value)} name="name" autoComplete="nickname" placeholder="怎么称呼你？" minLength={2} maxLength={24} required /></span>
          </label>
        )}
        <label className="ag-auth-field">
          <span>邮箱地址</span>
          <span className="ag-auth-input-wrap"><Mail size={18} /><input value={email} onChange={(event) => setEmail(event.target.value)} name="email" type="email" autoComplete="email" placeholder="name@example.com" maxLength={254} required /></span>
        </label>
        <label className="ag-auth-field">
          <span>登录密码</span>
          <span className="ag-auth-input-wrap"><LockKeyhole size={18} /><input value={password} onChange={(event) => setPassword(event.target.value)} name="password" type="password" autoComplete={isRegister ? "new-password" : "current-password"} placeholder={isRegister ? "至少 8 个字符" : "请输入密码"} minLength={isRegister ? 8 : 1} maxLength={72} required /></span>
        </label>
        {isRegister && (
          <label className="ag-auth-field">
            <span>确认密码</span>
            <span className="ag-auth-input-wrap"><LockKeyhole size={18} /><input value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} name="confirmPassword" type="password" autoComplete="new-password" placeholder="再次输入密码" minLength={8} maxLength={72} required /></span>
          </label>
        )}

        {error && <div className="ag-auth-error" role="alert">{error}</div>}

        <button className="ag-button ag-button-primary ag-auth-submit" type="submit" disabled={busy}>
          {busy ? <LoaderCircle className="ag-auth-spinner" size={18} /> : null}
          {busy ? "正在处理…" : isRegister ? "创建账号" : "登录 AgentGuard"}
          {!busy ? <ArrowRight size={18} /> : null}
        </button>
      </form>

      <div className="ag-auth-switch">
        {isRegister ? <>已经有账号？ <Link href="/login">立即登录</Link></> : <>还没有账号？ <Link href="/register">免费注册</Link></>}
      </div>
      <p className="ag-auth-security"><LockKeyhole size={14} /> 密码经过哈希处理，不会以明文保存。</p>
    </div>
  );
}
