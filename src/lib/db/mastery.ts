import type { Db } from "./client";
import type {
  BankAttemptRecord,
  ExamAttemptRecord,
  MasteryRecord,
  MasteryStage,
  ReviewAttemptRecord,
} from "@/lib/types";
import type { LevelId, TrackId } from "@/lib/content/schema";

type MasteryRow = {
  user_id: string;
  chapter_id: string;
  track_id: TrackId;
  stage: number;
  review_count: number;
  next_review_at: string | null;
  last_review_at: string | null;
  updated_at: string;
};

function mapMastery(row: MasteryRow): MasteryRecord {
  return {
    userId: row.user_id,
    chapterId: row.chapter_id,
    trackId: row.track_id,
    stage: Math.min(5, Math.max(1, row.stage)) as MasteryStage,
    reviewCount: row.review_count,
    nextReviewAt: row.next_review_at,
    lastReviewAt: row.last_review_at,
    updatedAt: row.updated_at,
  };
}

export function getMastery(db: Db, userId: string, chapterId: string): MasteryRecord | null {
  const row = db
    .prepare("SELECT * FROM chapter_mastery WHERE user_id = ? AND chapter_id = ?")
    .get(userId, chapterId) as MasteryRow | undefined;
  return row ? mapMastery(row) : null;
}

export function listMastery(db: Db, userId: string, trackId?: TrackId): MasteryRecord[] {
  const rows = trackId
    ? (db
        .prepare("SELECT * FROM chapter_mastery WHERE user_id = ? AND track_id = ?")
        .all(userId, trackId) as MasteryRow[])
    : (db.prepare("SELECT * FROM chapter_mastery WHERE user_id = ?").all(userId) as MasteryRow[]);
  return rows.map(mapMastery);
}

export function saveMastery(
  db: Db,
  record: {
    userId: string;
    chapterId: string;
    trackId: TrackId;
    stage: MasteryStage;
    reviewCount: number;
    nextReviewAt: string | null;
    lastReviewAt: string | null;
    updatedAt: string;
  },
): void {
  db.prepare(
    `INSERT INTO chapter_mastery (
       user_id, chapter_id, track_id, stage, review_count, next_review_at, last_review_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id, chapter_id) DO UPDATE SET
       track_id = excluded.track_id,
       stage = excluded.stage,
       review_count = excluded.review_count,
       next_review_at = excluded.next_review_at,
       last_review_at = excluded.last_review_at,
       updated_at = excluded.updated_at`,
  ).run(
    record.userId,
    record.chapterId,
    record.trackId,
    record.stage,
    record.reviewCount,
    record.nextReviewAt,
    record.lastReviewAt,
    record.updatedAt,
  );
}

export function recordReviewAttempt(
  db: Db,
  input: {
    id: string;
    userId: string;
    chapterId: string;
    trackId: TrackId;
    level: LevelId;
    score: number;
    total: number;
    details: unknown;
    createdAt: string;
  },
): void {
  db.prepare(
    `INSERT INTO review_attempts (id, user_id, chapter_id, track_id, level, score, total, details_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    input.id,
    input.userId,
    input.chapterId,
    input.trackId,
    input.level,
    input.score,
    input.total,
    JSON.stringify(input.details),
    input.createdAt,
  );
}

export function listReviewAttempts(db: Db, userId: string, limit = 20): ReviewAttemptRecord[] {
  const rows = db
    .prepare(
      "SELECT id, chapter_id, track_id, level, score, total, created_at FROM review_attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    )
    .all(userId, limit) as Array<{
    id: string;
    chapter_id: string;
    track_id: TrackId;
    level: LevelId;
    score: number;
    total: number;
    created_at: string;
  }>;
  return rows.map((row) => ({
    id: row.id,
    chapterId: row.chapter_id,
    trackId: row.track_id,
    level: row.level,
    score: row.score,
    total: row.total,
    createdAt: row.created_at,
  }));
}

export function recordBankAttempt(
  db: Db,
  input: {
    id: string;
    userId: string;
    scope: Record<string, unknown>;
    score: number;
    total: number;
    durationSeconds: number;
    details: unknown;
    createdAt: string;
  },
): void {
  db.prepare(
    `INSERT INTO bank_attempts (id, user_id, scope_json, score, total, duration_seconds, details_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    input.id,
    input.userId,
    JSON.stringify(input.scope),
    input.score,
    input.total,
    input.durationSeconds,
    JSON.stringify(input.details),
    input.createdAt,
  );
}

export function listBankAttempts(db: Db, userId: string, limit = 20): BankAttemptRecord[] {
  const rows = db
    .prepare(
      "SELECT id, scope_json, score, total, duration_seconds, created_at FROM bank_attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    )
    .all(userId, limit) as Array<{
    id: string;
    scope_json: string;
    score: number;
    total: number;
    duration_seconds: number;
    created_at: string;
  }>;
  return rows.map((row) => ({
    id: row.id,
    scope: JSON.parse(row.scope_json) as Record<string, unknown>,
    score: row.score,
    total: row.total,
    durationSeconds: row.duration_seconds,
    createdAt: row.created_at,
  }));
}

export function recordExamAttempt(
  db: Db,
  input: {
    id: string;
    userId: string;
    trackId: TrackId;
    level: LevelId;
    score: number;
    total: number;
    durationSeconds: number;
    details: unknown;
    createdAt: string;
  },
): void {
  db.prepare(
    `INSERT INTO exam_attempts (id, user_id, track_id, level, score, total, duration_seconds, details_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    input.id,
    input.userId,
    input.trackId,
    input.level,
    input.score,
    input.total,
    input.durationSeconds,
    JSON.stringify(input.details),
    input.createdAt,
  );
}

export function listExamAttempts(db: Db, userId: string, limit = 20): ExamAttemptRecord[] {
  const rows = db
    .prepare(
      "SELECT id, track_id, level, score, total, duration_seconds, created_at FROM exam_attempts WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    )
    .all(userId, limit) as Array<{
    id: string;
    track_id: TrackId;
    level: LevelId;
    score: number;
    total: number;
    duration_seconds: number;
    created_at: string;
  }>;
  return rows.map((row) => ({
    id: row.id,
    trackId: row.track_id,
    level: row.level,
    score: row.score,
    total: row.total,
    durationSeconds: row.duration_seconds,
    createdAt: row.created_at,
  }));
}
