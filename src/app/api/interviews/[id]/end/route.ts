import { NextResponse } from "next/server";
import { guardApi, routeError } from "@/lib/http";
import { endInterviewForUser } from "@/lib/services/interviews";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await guardApi(request);
  if ("response" in guard) return guard.response;
  const { id } = await context.params;
  try {
    const summary = endInterviewForUser(guard.user.id, id);
    return NextResponse.json({ ok: true, summary });
  } catch (error) {
    return routeError(error);
  }
}
