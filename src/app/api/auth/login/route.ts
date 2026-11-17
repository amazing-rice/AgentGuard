import { compare } from "bcryptjs";
import { loginSchema, isBcryptPasswordLengthValid } from "@/lib/auth-validation";
import { createUserSession, isSameOriginRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "ORIGIN_MISMATCH" }, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({
      error: "INVALID_INPUT",
      message: parsed.error.issues[0]?.message ?? "请检查邮箱和密码",
    }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const password = parsed.data.password;

  if (!isBcryptPasswordLengthValid(password)) {
    return Response.json({
      error: "INVALID_CREDENTIALS",
      message: "邮箱或密码不正确",
    }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  const passwordMatches = user ? await compare(password, user.passwordHash) : false;

  if (!user || !passwordMatches) {
    return Response.json({
      error: "INVALID_CREDENTIALS",
      message: "邮箱或密码不正确",
    }, { status: 401 });
  }

  await createUserSession(user.id);

  return Response.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    },
  }, {
    headers: { "Cache-Control": "no-store" },
  });
}
