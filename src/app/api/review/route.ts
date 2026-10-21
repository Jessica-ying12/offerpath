import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { guardApi, parseJson, routeError } from "@/lib/http";
import { submitReview } from "@/lib/services/mastery";

const schema = z.object({
  chapterId: z.string().min(3).max(100),
  answers: z
    .array(
      z.object({
        questionId: z.string().min(3).max(100),
        selectedIndex: z.number().int().min(0).max(3),
      }),
    )
    .min(3)
    .max(12),
});

export async function POST(request: Request) {
  const guard = await guardApi(request);
  if ("response" in guard) return guard.response;
  const parsed = await parseJson(request, schema);
  if ("response" in parsed) return parsed.response;
  try {
    const result = submitReview(guard.user.id, parsed.data);
    return NextResponse.json({
      ok: true,
      result: {
        attemptId: randomUUID(),
        score: result.score,
        correct: result.score,
        total: result.total,
        details: result.details,
        review: result,
      },
    });
  } catch (error) {
    return routeError(error);
  }
}
