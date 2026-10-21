import { NextResponse } from "next/server";
import { guardApi, routeError } from "@/lib/http";
import { getChallengeSolution } from "@/lib/services/learning";

export async function GET(
  request: Request,
  context: { params: Promise<{ challengeId: string }> },
) {
  const guard = await guardApi(request);
  if ("response" in guard) return guard.response;
  const { challengeId } = await context.params;
  try {
    const result = getChallengeSolution(guard.user.id, challengeId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return routeError(error);
  }
}
