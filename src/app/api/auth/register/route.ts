import { NextResponse } from "next/server";
import { z } from "zod";
import { registerUser } from "@/lib/services/account";
import { createUserSession, setSessionCookie } from "@/lib/auth";
import { assertSameOrigin, jsonError, parseJson, routeError } from "@/lib/http";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().trim().min(2, "昵称至少 2 个字符").max(40),
  email: z.string().trim().email("邮箱格式不正确").max(200),
  password: z.string().min(8, "密码至少 8 位").max(200),
});

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return jsonError("请求来源校验失败", 403);
  const parsed = await parseJson(request, schema);
  if ("response" in parsed) return parsed.response;
  const { name, email, password } = parsed.data;
  if (!checkRateLimit(`register:${email.toLowerCase()}`, 5, 10 * 60_000)) {
    return jsonError("操作过于频繁，请稍后再试", 429);
  }
  try {
    const user = registerUser({ name, email, password });
    const session = await createUserSession(user.id);
    await setSessionCookie(session.token, session.expiresAt);
    return NextResponse.json({ ok: true, userId: user.id });
  } catch (error) {
    return routeError(error);
  }
}
