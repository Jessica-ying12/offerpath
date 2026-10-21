import { NextResponse } from "next/server";
import { revokeCurrentSession } from "@/lib/auth";
import { assertSameOrigin, jsonError } from "@/lib/http";

export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return jsonError("请求来源校验失败", 403);
  await revokeCurrentSession();
  return NextResponse.json({ ok: true });
}
