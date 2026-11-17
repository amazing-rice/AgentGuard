"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, LoaderCircle } from "lucide-react";

export function LogoutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" className="ag-button ag-button-ghost" onClick={() => void logout()} disabled={busy}>
      {busy ? <LoaderCircle className="ag-auth-spinner" size={17} /> : <LogOut size={17} />}
      {busy ? "正在退出…" : "退出登录"}
    </button>
  );
}
