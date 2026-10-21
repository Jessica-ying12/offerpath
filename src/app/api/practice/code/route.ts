import { NextResponse } from "next/server";
import { z } from "zod";
import { guardApi, parseJson, routeError } from "@/lib/http";
import { submitCodeForUser } from "@/lib/services/learning";

const schema = z.object({
  challengeId: z.string().min(3).max(100),
  code: z.string().max(20_000),
  passed: z.number().int().min(0).max(20),
  total: z.number().int().min(1).max(20),
});

export async function POST(request: Request) {
  const guard = await guardApi(request);
  if ("response" in guard) return guard.response;
  const parsed = await parseJson(request, schema);
  if ("response" in parsed) return parsed.response;
  try {
    const result = submitCodeForUser(guard.user.id, parsed.data);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return routeError(error);
  }
}
