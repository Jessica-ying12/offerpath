import { NextResponse } from "next/server";
import type { z } from "zod";
import { getCurrentUser } from "./auth";
import { AppError, errorStatus } from "./errors";
import type { User } from "./types";

export function jsonError(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

export function assertSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function requireApiUser(): Promise<User | null> {
  return getCurrentUser();
}

export async function guardApi(
  request: Request,
): Promise<{ user: User } | { response: NextResponse }> {
  if (!assertSameOrigin(request)) {
    return { response: jsonError("请求来源校验失败", 403) };
  }
  const user = await requireApiUser();
  if (!user) return { response: jsonError("请先登录", 401) };
  return { user };
}

export async function parseJson<T>(
  request: Request,
  schema: z.ZodSchema<T>,
): Promise<{ data: T } | { response: NextResponse }> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return { response: jsonError("请求格式不正确", 400) };
  }
  const result = schema.safeParse(payload);
  if (!result.success) {
    const first = result.error.issues[0];
    return { response: jsonError(first?.message ?? "参数不合法", 400) };
  }
  return { data: result.data };
}

export function routeError(error: unknown): NextResponse {
  const status = errorStatus(error);
  if (status >= 500) {
    console.error("API error:", error instanceof Error ? error.message : error);
  }
  return jsonError(
    error instanceof AppError ? error.message : "服务暂时不可用，请稍后重试",
    status,
  );
}

export async function readJsonObject(
  request: Request,
): Promise<{ data: Record<string, unknown> } | { response: NextResponse }> {
  try {
    const payload = (await request.json()) as unknown;
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return { response: jsonError("请求格式不正确", 400) };
    }
    return { data: payload as Record<string, unknown> };
  } catch {
    return { response: jsonError("请求格式不正确", 400) };
  }
}
