import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { hashSessionToken, issueSessionToken } from "./session-token";
import { getDb } from "./db/client";
import {
  createSession,
  deleteSession,
  findUserBySession,
  findUserById,
  getProfile,
} from "./db/users";
import type { Profile, User } from "./types";
import { SESSION_COOKIE, SESSION_TTL_DAYS } from "./constants";

export { hashSessionToken } from "./session-token";

export async function createUserSession(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const db = getDb();
  const { token, tokenHash } = issueSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000);
  createSession(db, {
    tokenHash,
    userId,
    expiresAt: expiresAt.toISOString(),
    createdAt: new Date().toISOString(),
  });
  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function revokeCurrentSession(): Promise<void> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) deleteSession(getDb(), hashSessionToken(token));
  await clearSessionCookie();
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return findUserBySession(getDb(), hashSessionToken(token), new Date().toISOString());
});

export async function requireUser(nextPath = "/dashboard"): Promise<User> {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  return user;
}

export async function requireProfile(user: User): Promise<Profile> {
  const profile = getProfile(getDb(), user.id);
  if (profile) return profile;
  const now = new Date().toISOString();
  return {
    userId: user.id,
    trackId: "fullstack",
    level: "junior",
    targetRole: "",
    targetCompany: "",
    resumeText: "",
    jdText: "",
    onboarded: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function findSessionUser(userId: string): User | null {
  return findUserById(getDb(), userId);
}
