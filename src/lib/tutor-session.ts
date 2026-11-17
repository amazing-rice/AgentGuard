/** Client-side session identity checks for the floating tutor. Never trust a client-supplied identity on the server. */
export function isSameTutorSession(expected: string | null, actual: string | null): boolean {
  return expected === actual;
}

export class TutorSessionChangedError extends Error {
  constructor() {
    super("检测到登录身份变化，已保护旧对话。请重新打开 AI 助手。");
    this.name = "TutorSessionChangedError";
  }
}

export async function readTutorSessionId(signal?: AbortSignal): Promise<string | null> {
  const response = await fetch("/api/auth/me", {
    credentials: "same-origin",
    cache: "no-store",
    signal,
  });
  if (!response.ok) throw new Error("无法核实当前登录状态，请稍后重试。");
  const payload: unknown = await response.json();
  if (!payload || typeof payload !== "object" || !("user" in payload)) {
    throw new Error("登录状态响应格式不正确。");
  }
  const user = (payload as { user?: { id?: unknown } | null }).user;
  if (user === null) return null;
  if (!user || typeof user.id !== "string" || !user.id) {
    throw new Error("登录状态缺少有效用户标识。");
  }
  return user.id;
}

/** Called before AND after a paid request; prevents old history being sent under a new account. */
export async function assertTutorSession(expected: string | null): Promise<void> {
  const actual = await readTutorSessionId();
  if (!isSameTutorSession(expected, actual)) throw new TutorSessionChangedError();
}
