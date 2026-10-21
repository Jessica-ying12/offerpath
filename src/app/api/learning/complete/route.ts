import { NextResponse } from "next/server";
import { z } from "zod";
import { guardApi, parseJson, routeError } from "@/lib/http";
import { completeAtomForUser } from "@/lib/services/learning";

const schema = z.object({ atomId: z.string().min(3).max(80) });

export async function POST(request: Request) {
  const guard = await guardApi(request);
  if ("response" in guard) return guard.response;
  const parsed = await parseJson(request, schema);
  if ("response" in parsed) return parsed.response;
  try {
    const result = completeAtomForUser(guard.user.id, parsed.data.atomId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return routeError(error);
  }
}
