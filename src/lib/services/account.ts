import { randomUUID } from "node:crypto";
import { getDb, type Db } from "@/lib/db/client";
import {
  createUser,
  findUserWithPassword,
  getProfile,
  saveProfile,
  updateUserName,
} from "@/lib/db/users";
import { logActivity } from "@/lib/db/activities";
import { AppError } from "@/lib/errors";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { LevelId, TrackId } from "@/lib/content/schema";
import type { Profile, User } from "@/lib/types";
import { MAX_JD_LENGTH, MAX_RESUME_LENGTH } from "@/lib/constants";

export function registerUser(
  input: { name: string; email: string; password: string },
  db: Db = getDb(),
): User {
  const email = input.email.trim().toLowerCase();
  const name = input.name.trim();
  if (!email.includes("@")) throw new AppError("邮箱格式不正确");
  if (name.length < 2) throw new AppError("昵称至少 2 个字符");
  if (input.password.length < 8) throw new AppError("密码至少 8 位");

  const existing = findUserWithPassword(db, email);
  if (existing) throw new AppError("该邮箱已注册", 409);

  const now = new Date().toISOString();
  const user: User = {
    id: randomUUID(),
    email,
    name,
    createdAt: now,
  };
  const profile: Profile = {
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

  const run = db.transaction(() => {
    createUser(db, {
      id: user.id,
      email,
      name,
      passwordHash: hashPassword(input.password),
      createdAt: now,
    });
    saveProfile(db, profile);
    logActivity(db, {
      id: randomUUID(),
      userId: user.id,
      type: "account_created",
      title: "创建了职跃账号",
      meta: { href: "/onboarding" },
      createdAt: now,
    });
  });
  try {
    run();
  } catch (error) {
    if (error instanceof Error && error.message.includes("UNIQUE")) {
      throw new AppError("该邮箱已注册", 409);
    }
    throw error;
  }
  return user;
}

export function authenticateUser(
  input: { email: string; password: string },
  db: Db = getDb(),
): User | null {
  const user = findUserWithPassword(db, input.email.trim().toLowerCase());
  if (!user) return null;
  if (!verifyPassword(input.password, user.passwordHash)) return null;
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}

export type ProfileUpdateInput = {
  name?: string;
  trackId?: TrackId;
  level?: LevelId;
  targetRole?: string;
  targetCompany?: string;
  resumeText?: string;
  jdText?: string;
  onboarded?: boolean;
};

export function updateProfile(
  userId: string,
  input: ProfileUpdateInput,
  db: Db = getDb(),
): Profile {
  const existing = getProfile(db, userId);
  if (!existing) throw new AppError("用户资料不存在", 404);
  if (input.resumeText && input.resumeText.length > MAX_RESUME_LENGTH) {
    throw new AppError("简历内容不能超过 20000 字");
  }
  if (input.jdText && input.jdText.length > MAX_JD_LENGTH) {
    throw new AppError("JD 内容不能超过 20000 字");
  }
  const now = new Date().toISOString();
  const next: Profile = {
    ...existing,
    trackId: input.trackId ?? existing.trackId,
    level: input.level ?? existing.level,
    targetRole: input.targetRole !== undefined ? input.targetRole.trim() : existing.targetRole,
    targetCompany:
      input.targetCompany !== undefined ? input.targetCompany.trim() : existing.targetCompany,
    resumeText: input.resumeText !== undefined ? input.resumeText.trim() : existing.resumeText,
    jdText: input.jdText !== undefined ? input.jdText.trim() : existing.jdText,
    onboarded: input.onboarded ?? existing.onboarded,
    updatedAt: now,
  };

  const name = input.name?.trim();
  if (name !== undefined && name.length > 0 && name.length < 2) {
    throw new AppError("昵称至少 2 个字符");
  }

  const run = db.transaction(() => {
    if (name && name !== undefined) updateUserName(db, userId, name);
    saveProfile(db, next);
    logActivity(db, {
      id: randomUUID(),
      userId,
      type: "profile_updated",
      title: next.onboarded && !existing.onboarded ? `设定目标：${next.trackId} / ${next.level}` : "更新了求职资料",
      meta: { href: "/profile" },
      createdAt: now,
    });
  });
  run();
  return next;
}

export function getProfileOrDefault(userId: string, db: Db = getDb()): Profile {
  const profile = getProfile(db, userId);
  if (profile) return profile;
  const now = new Date().toISOString();
  return {
    userId,
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
