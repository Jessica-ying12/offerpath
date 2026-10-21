import { NextResponse } from "next/server";
import { z } from "zod";
import { guardApi, parseJson, routeError } from "@/lib/http";
import { submitExam } from "@/lib/services/bank";

const schema = z.object({
  trackId: z.enum(["mobile", "fullstack", "backend-java", "database-mysql", "cs-ai-foundations"]),
  level: z.enum(["junior", "middle", "senior"]),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(3).max(100),
        selectedIndex: z.number().int().min(0).max(3),
      }),
    )
    .min(5)
    .max(30),
  durationSeconds: z.number().int().min(0).max(14400).default(0),
});

export async function POST(request: Request) {
  const guard = await guardApi(request);
  if ("response" in guard) return guard.response;
  const parsed = await parseJson(request, schema);
  if ("response" in parsed) return parsed.response;
  try {
    const result = submitExam(guard.user.id, {
      trackId: parsed.data.trackId,
      level: parsed.data.level,
      answers: parsed.data.answers,
      durationSeconds: parsed.data.durationSeconds ?? 0,
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return routeError(error);
  }
}
