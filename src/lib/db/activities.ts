import type { Db } from "./client";
import type { Activity, ActivityType } from "@/lib/types";

type ActivityRow = {
  id: string;
  type: ActivityType;
  title: string;
  meta_json: string;
  created_at: string;
};

export function logActivity(
  db: Db,
  input: {
    id: string;
    userId: string;
    type: ActivityType;
    title: string;
    meta?: Record<string, unknown>;
    createdAt: string;
  },
): void {
  db.prepare(
    "INSERT INTO activities (id, user_id, type, title, meta_json, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  ).run(
    input.id,
    input.userId,
    input.type,
    input.title,
    JSON.stringify(input.meta ?? {}),
    input.createdAt,
  );
}

export function listActivities(db: Db, userId: string, limit = 100): Activity[] {
  const rows = db
    .prepare(
      "SELECT id, type, title, meta_json, created_at FROM activities WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    )
    .all(userId, limit) as ActivityRow[];
  return rows.map((row) => ({
    id: row.id,
    type: row.type,
    title: row.title,
    meta: safeParseMeta(row.meta_json),
    createdAt: row.created_at,
  }));
}

export function listActivityDays(db: Db, userId: string, limit = 60): string[] {
  const rows = db
    .prepare(
      "SELECT DISTINCT substr(created_at, 1, 10) AS day FROM activities WHERE user_id = ? ORDER BY day DESC LIMIT ?",
    )
    .all(userId, limit) as Array<{ day: string }>;
  return rows.map((row) => row.day);
}

function safeParseMeta(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value) as unknown;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}
