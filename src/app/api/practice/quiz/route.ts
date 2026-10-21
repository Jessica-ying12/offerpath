import { NextResponse } from "next/server";
import { z } from "zod";
import { guardApi, parseJson, routeError } from "@/lib/http";
import { submitQuizForUser } from "@/lib/services/learning";

const schema = z.object({
  sourceType: z.enum(["chapter", "mistake"]),
  sourceId: z.string().min(1).max(80),
  durationSeconds: z.number().int().min(0).max(7200).default(0),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(3).max(100),
        selectedIndex: z.number().int().min(0).max(3),
      }),
    )
    .min(1)
    .max(20),
});

export async function POST(request: Request) {
  const guard = await guardApi(request);
  if ("response" in guard) return guard.response;
  const parsed = await parseJson(request, schema);
  if ("response" in parsed) return parsed.response;
  try {
    const result = submitQuizForUser(guard.user.id, {
      sourceType: parsed.data.sourceType,
      sourceId: parsed.data.sourceId,
      answers: parsed.data.answers,
      durationSeconds: parsed.data.durationSeconds ?? 0,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return routeError(error);
  }
}
