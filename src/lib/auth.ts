import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "agentguard_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const SESSION_TTL_MS = SESSION_TTL_SECONDS * 1000;

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: string;
  createdAt: Date;
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}


export function isSameOriginRequest(request: Request): boolean {
  const origin = request.headers.get("origin");

  // 保留原有行为：没有 Origin 的请求交由后续认证和校验处理
  if (!origin) return true;

  try {
    const browserOrigin = new URL(origin).origin;
    const requestOrigin = new URL(request.url).origin;

    // 本地开发及没有反向代理时的正常同源请求
    if (browserOrigin === requestOrigin) {
      return true;
    }

    // Railway 反向代理环境：只允许显式配置的公网域名
    const publicOrigin = process.env.AGENTGUARD_PUBLIC_ORIGIN;

    if (!publicOrigin) {
      return false;
    }

    const configuredUrl = new URL(publicOrigin);

    // 生产公网地址必须使用 HTTPS
    return (
      configuredUrl.protocol === "https:" &&
      browserOrigin === configuredUrl.origin
    );
  } catch {
    return false;
  }
}


export async function createUserSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await prisma.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
    },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function revokeCurrentSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({
      where: { tokenHash: hashToken(token) },
    });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.deleteMany({ where: { id: session.id } });
    return null;
  }

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
    createdAt: session.user.createdAt,
  };
}
