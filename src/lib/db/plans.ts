import type { Db } from "./client";
import type { CareerPlan, PlanRecord, SprintPlan } from "@/lib/types";
import type { LevelId, TrackId } from "@/lib/content/schema";

type PlanRow = {
  id: string;
  user_id: string;
  kind: "sprint" | "career";
  track_id: TrackId;
  level: LevelId;
  title: string;
  input_json: string;
  plan_json: string;
  created_at: string;
};

function mapPlan(row: PlanRow): PlanRecord {
  return {
    id: row.id,
    userId: row.user_id,
    kind: row.kind,
    trackId: row.track_id,
    level: row.level,
    title: row.title,
    input: JSON.parse(row.input_json) as Record<string, unknown>,
    plan: JSON.parse(row.plan_json) as SprintPlan | CareerPlan,
    createdAt: row.created_at,
  };
}

export function createPlan(
  db: Db,
  input: {
    id: string;
    userId: string;
    kind: "sprint" | "career";
    trackId: TrackId;
    level: LevelId;
    title: string;
    input: Record<string, unknown>;
    plan: SprintPlan | CareerPlan;
    createdAt: string;
  },
): void {
  db.prepare(
    `INSERT INTO plans (id, user_id, kind, track_id, level, title, input_json, plan_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    input.id,
    input.userId,
    input.kind,
    input.trackId,
    input.level,
    input.title,
    JSON.stringify(input.input),
    JSON.stringify(input.plan),
    input.createdAt,
  );
}

export function getPlan(db: Db, userId: string, id: string): PlanRecord | null {
  const row = db
    .prepare("SELECT * FROM plans WHERE id = ? AND user_id = ?")
    .get(id, userId) as PlanRow | undefined;
  return row ? mapPlan(row) : null;
}

export function listPlans(
  db: Db,
  userId: string,
  kind?: "sprint" | "career",
  limit = 20,
): PlanRecord[] {
  const rows = kind
    ? (db
        .prepare(
          "SELECT * FROM plans WHERE user_id = ? AND kind = ? ORDER BY created_at DESC LIMIT ?",
        )
        .all(userId, kind, limit) as PlanRow[])
    : (db
        .prepare("SELECT * FROM plans WHERE user_id = ? ORDER BY created_at DESC LIMIT ?")
        .all(userId, limit) as PlanRow[]);
  return rows.map(mapPlan);
}
