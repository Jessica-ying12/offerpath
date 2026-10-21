import { NextResponse } from "next/server";
import { z } from "zod";
import { guardApi, parseJson, routeError } from "@/lib/http";
import { createInterviewForUser } from "@/lib/services/interviews";
import { MAX_JD_LENGTH, MAX_RESUME_LENGTH } from "@/lib/constants";

const schema = z.object({
  trackId: z.enum(["mobile", "fullstack"]),
  level: z.enum(["junior", "middle", "senior"]),
  mode: z.enum(["resume", "jd", "position"]),
  company: z.string().trim().max(80).optional(),
  resumeText: z.string().max(MAX_RESUME_LENGTH).optional(),
  jdText: z.string().max(MAX_JD_LENGTH).optional(),
});

export async function POST(request: Request) {
  const guard = await guardApi(request);
  if ("response" in guard) return guard.response;
  const parsed = await parseJson(request, schema);
  if ("response" in parsed) return parsed.response;
  try {
    const result = createInterviewForUser(guard.user.id, parsed.data);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return routeError(error);
  }
}
