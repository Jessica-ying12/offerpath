import { NextResponse } from "next/server";
import { z } from "zod";
import { guardApi, parseJson, routeError } from "@/lib/http";
import { submitBankQuiz } from "@/lib/services/bank";

const schema = z.object({
  answers: z
    .array(
      z.object({
        questionId: z.string().min(3).max(100),
        selectedIndex: z.number().int().min(0).max(3),
      }),
    )
    .min(1)
    .max(30),
  scope: z.record(z.unknown()).default({}),
  durationSeconds: z.number().int().min(0).max(7200).default(0),
});

export async function POST(request: Request) {
  const guard = await guardApi(request);
  if ("response" in guard) return guard.response;
  const parsed = await parseJson(request, schema);
  if ("response" in parsed) return parsed.response;
  try {
    const result = submitBankQuiz(guard.user.id, {
      answers: parsed.data.answers,
      scope: parsed.data.scope ?? {},
      durationSeconds: parsed.data.durationSeconds ?? 0,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return routeError(error);
  }
}
