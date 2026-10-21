import { NextResponse } from "next/server";
import { z } from "zod";
import { updateProfile } from "@/lib/services/account";
import { guardApi, parseJson, routeError } from "@/lib/http";
import { MAX_JD_LENGTH, MAX_RESUME_LENGTH } from "@/lib/constants";

const schema = z.object({
  name: z.string().trim().min(2).max(40).optional(),
  trackId: z.enum(["mobile", "fullstack"]).optional(),
  level: z.enum(["junior", "middle", "senior"]).optional(),
  targetRole: z.string().trim().max(80).optional(),
  targetCompany: z.string().trim().max(80).optional(),
  resumeText: z.string().max(MAX_RESUME_LENGTH).optional(),
  jdText: z.string().max(MAX_JD_LENGTH).optional(),
  onboarded: z.boolean().optional(),
});

export async function POST(request: Request) {
  const guard = await guardApi(request);
  if ("response" in guard) return guard.response;
  const parsed = await parseJson(request, schema);
  if ("response" in parsed) return parsed.response;
  try {
    const profile = updateProfile(guard.user.id, parsed.data);
    return NextResponse.json({
      ok: true,
      profile: {
        trackId: profile.trackId,
        level: profile.level,
        onboarded: profile.onboarded,
      },
    });
  } catch (error) {
    return routeError(error);
  }
}
