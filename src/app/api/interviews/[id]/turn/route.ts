import { NextResponse } from "next/server";
import { z } from "zod";
import { guardApi, parseJson, routeError } from "@/lib/http";
import { submitInterviewTurn } from "@/lib/services/interviews";
import { MAX_ANSWER_LENGTH } from "@/lib/constants";

const schema = z.object({
  questionId: z.string().min(3).max(120),
  answer: z.string().min(10, "回答至少 10 个字").max(MAX_ANSWER_LENGTH),
});

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const guard = await guardApi(request);
  if ("response" in guard) return guard.response;
  const parsed = await parseJson(request, schema);
  if ("response" in parsed) return parsed.response;
  const { id } = await context.params;
  try {
    const result = submitInterviewTurn(guard.user.id, id, parsed.data);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return routeError(error);
  }
}
