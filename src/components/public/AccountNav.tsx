"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { UserRound } from "lucide-react";

type NavUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export function AccountNav() {
  const [user, setUser] = useState<NavUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    fetch("/api/auth/me", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return null;
        const data = await response.json() as { user?: NavUser | null };
        return data.user ?? null;
      })
      .then((value) => { if (active) setUser(value); })
      .catch(() => { if (active) setUser(null); })
      .finally(() => { if (active) setLoaded(true); });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  if (!loaded) {
    return <span className="ag-account-loading" aria-label="正在读取账户状态" />;
  }

  if (user) {
    return (
      <div className="ag-account-nav">
        <Link href="/account" className="ag-account-link">
          <span className="ag-account-avatar"><UserRound size={17} /></span>
          <span>{user.name}<small>个人中心</small></span>
        </Link>
        {user.role === "ADMIN" ? <Link className="ag-admin-shortcut" href="/admin">管理后台</Link> : null}
      </div>
    );
  }

  return (
    <div className="ag-account-nav">
      <Link className="ag-login-link" href="/login">登录</Link>
      <Link className="ag-register-link" href="/register">免费注册</Link>
    </div>
  );
}
