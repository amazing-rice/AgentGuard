import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "昵称至少需要 2 个字符").max(24, "昵称不能超过 24 个字符"),
  email: z.string().trim().email("请输入有效的邮箱地址").max(254),
  password: z.string().min(8, "密码至少需要 8 个字符").max(72, "密码不能超过 72 个字符"),
  confirmPassword: z.string().min(8, "请再次输入密码").max(72),
}).refine((value) => value.password === value.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().trim().email("请输入有效的邮箱地址").max(254),
  password: z.string().min(1, "请输入密码").max(72),
});

export function isBcryptPasswordLengthValid(password: string): boolean {
  return Buffer.byteLength(password, "utf8") <= 72;
}
