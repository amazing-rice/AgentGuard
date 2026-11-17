import { hash } from "bcryptjs";
import { registerSchema, isBcryptPasswordLengthValid } from "@/lib/auth-validation";
import { createUserSession, isSameOriginRequest } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) {
    return Response.json({ error: "ORIGIN_MISMATCH" }, { status: 403 });
  }

  const body: unknown = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({
      error: "INVALID_INPUT",
      message: parsed.error.issues[0]?.message ?? "请检查填写内容",
    }, { status: 400 });
  }

  const { name, password } = parsed.data;
  const email = parsed.data.email.toLowerCase();

  if (!isBcryptPasswordLengthValid(password)) {
    return Response.json({
      error: "PASSWORD_TOO_LONG",
      message: "密码的 UTF-8 长度不能超过 72 字节",
    }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (existing) {
    return Response.json({
      error: "EMAIL_ALREADY_EXISTS",
      message: "这个邮箱已经注册，请直接登录",
    }, { status: 409 });
  }

  try {
    const passwordHash = await hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    await createUserSession(user.id);

    return Response.json({ user }, {
      status: 201,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return Response.json({
        error: "EMAIL_ALREADY_EXISTS",
        message: "这个邮箱已经注册，请直接登录",
      }, { status: 409 });
    }

    return Response.json({
      error: "REGISTER_FAILED",
      message: "注册暂时无法完成，请稍后重试",
    }, { status: 500 });
  }
}
