import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticateUser } from "@/lib/services/account";
import { createUserSession, setSessionCookie } from "@/lib/auth";
import { assertSameOrigin, jsonError, parseJson, routeError } from "@/lib/http";
import { getProfile } from "@/lib/db/users";
import { getDb } from "@/lib/db/client";
import { checkRateLimit } from "@/lib/rate-limit";

const schema = z.object({
  email: z.string().trim().email("邮箱格式不正确").max(200),
  password: z.string().min(1, "请输入密码").max(200),
});

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return jsonError("请求来源校验失败", 403);
  const parsed = await parseJson(request, schema);
  if ("response" in parsed) return parsed.response;
  const email = parsed.data.email.toLowerCase();
  if (!checkRateLimit(`login:${email}`, 8, 10 * 60_000)) {
    return jsonError("尝试次数过多，请 10 分钟后再试", 429);
  }
  try {
    const user = authenticateUser({ email, password: parsed.data.password });
    if (!user) return jsonError("邮箱或密码不正确", 401);
    const session = await createUserSession(user.id);
    await setSessionCookie(session.token, session.expiresAt);
    const profile = getProfile(getDb(), user.id);
    return NextResponse.json({ ok: true, onboarded: profile?.onboarded ?? false });
  } catch (error) {
    return routeError(error);
  }
}
