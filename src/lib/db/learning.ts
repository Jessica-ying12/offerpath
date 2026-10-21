import type { Db } from "./client";
import type { LevelId, TrackId } from "@/lib/content/schema";
import type { MistakeRecord, QuizDetail } from "@/lib/types";

type MistakeRow = {
  question_id: string;
  track_id: TrackId;
  wrong_count: number;
  last_wrong_at: string;
  resolved_at: string | null;
};

export function completeAtom(
  db: Db,
  input: { userId: string; atomId: string; chapterId: string; trackId: TrackId; completedAt: string },
): boolean {
  const result = db
    .prepare(
      `INSERT OR IGNORE INTO lesson_progress (user_id, atom_id, chapter_id, track_id, completed_at)
       VALUES (?, ?, ?, ?, ?)`,
    )
    .run(input.userId, input.atomId, input.chapterId, input.trackId, input.completedAt);
  return result.changes > 0;
}

export function getCompletedAtomIds(db: Db, userId: string, trackId?: TrackId): Set<string> {
  const rows = trackId
    ? (db
        .prepare("SELECT atom_id FROM lesson_progress WHERE user_id = ? AND track_id = ?")
        .all(userId, trackId) as Array<{ atom_id: string }>)
    : (db
        .prepare("SELECT atom_id FROM lesson_progress WHERE user_id = ?")
        .all(userId) as Array<{ atom_id: string }>);
  return new Set(rows.map((row) => row.atom_id));
}

export function getChapterCompletion(db: Db, userId: string, trackId: TrackId): Map<string, number> {
  const rows = db
    .prepare(
      `SELECT chapter_id, COUNT(*) AS total FROM lesson_progress
       WHERE user_id = ? AND track_id = ? GROUP BY chapter_id`,
    )
    .all(userId, trackId) as Array<{ chapter_id: string; total: number }>;
  return new Map(rows.map((row) => [row.chapter_id, row.total]));
}

export function getLastCompletedAtom(
  db: Db,
  userId: string,
  trackId: TrackId,
): { atomId: string; chapterId: string; completedAt: string } | null {
  const row = db
    .prepare(
      `SELECT atom_id, chapter_id, completed_at FROM lesson_progress
       WHERE user_id = ? AND track_id = ? ORDER BY completed_at DESC LIMIT 1`,
    )
    .get(userId, trackId) as
    | { atom_id: string; chapter_id: string; completed_at: string }
    | undefined;
  return row
    ? { atomId: row.atom_id, chapterId: row.chapter_id, completedAt: row.completed_at }
    : null;
}

export function countCompletedAtoms(db: Db, userId: string): number {
  const row = db
    .prepare("SELECT COUNT(*) AS total FROM lesson_progress WHERE user_id = ?")
    .get(userId) as { total: number };
  return row.total;
}

export function recordQuizAttempt(
  db: Db,
  input: {
    id: string;
    userId: string;
    sourceType: "chapter" | "mistake";
    sourceId: string;
    trackId: TrackId;
    level: LevelId;
    score: number;
    total: number;
    durationSeconds: number;
    details: QuizDetail[];
    createdAt: string;
  },
): void {
  db.prepare(
    `INSERT INTO quiz_attempts (
       id, user_id, source_type, source_id, track_id, level, score, total,
       duration_seconds, details_json, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    input.id,
    input.userId,
    input.sourceType,
    input.sourceId,
    input.trackId,
    input.level,
    input.score,
    input.total,
    input.durationSeconds,
    JSON.stringify(input.details),
    input.createdAt,
  );
}

export function getQuizStats(
  db: Db,
  userId: string,
): { attempts: number; correct: number; total: number } {
  const row = db
    .prepare(
      "SELECT COUNT(*) AS attempts, COALESCE(SUM(score),0) AS correct, COALESCE(SUM(total),0) AS total FROM quiz_attempts WHERE user_id = ?",
    )
    .get(userId) as { attempts: number; correct: number; total: number };
  return row;
}

export function getLatestChapterAttempt(
  db: Db,
  userId: string,
  chapterId: string,
): { score: number; total: number; createdAt: string } | null {
  const row = db
    .prepare(
      `SELECT score, total, created_at FROM quiz_attempts
       WHERE user_id = ? AND source_type = 'chapter' AND source_id = ?
       ORDER BY created_at DESC LIMIT 1`,
    )
    .get(userId, chapterId) as { score: number; total: number; created_at: string } | undefined;
  return row ? { score: row.score, total: row.total, createdAt: row.created_at } : null;
}

export function getAttemptedChapterIds(db: Db, userId: string, trackId: TrackId): Set<string> {
  const rows = db
    .prepare(
      `SELECT DISTINCT source_id FROM quiz_attempts
       WHERE user_id = ? AND track_id = ? AND source_type = 'chapter'`,
    )
    .all(userId, trackId) as Array<{ source_id: string }>;
  return new Set(rows.map((row) => row.source_id));
}

export function applyQuizOutcomes(
  db: Db,
  input: {
    userId: string;
    wrong: Array<{ questionId: string; trackId: TrackId }>;
    correct: Array<{ questionId: string }>;
    now: string;
  },
): number {
  let resolved = 0;
  const insertMistake = db.prepare(
    `INSERT INTO mistakes (user_id, question_id, track_id, wrong_count, last_wrong_at, resolved_at)
     VALUES (?, ?, ?, 1, ?, NULL)
     ON CONFLICT(user_id, question_id) DO UPDATE SET
       wrong_count = wrong_count + 1,
       last_wrong_at = excluded.last_wrong_at,
       resolved_at = NULL,
       track_id = excluded.track_id`,
  );
  const resolveMistake = db.prepare(
    "UPDATE mistakes SET resolved_at = ? WHERE user_id = ? AND question_id = ? AND resolved_at IS NULL",
  );

  const run = db.transaction(() => {
    for (const wrong of input.wrong) {
      insertMistake.run(input.userId, wrong.questionId, wrong.trackId, input.now);
    }
    for (const correct of input.correct) {
      const result = resolveMistake.run(input.now, input.userId, correct.questionId);
      resolved += result.changes;
    }
  });
  run();
  return resolved;
}

export function listMistakes(
  db: Db,
  userId: string,
  options: { openOnly?: boolean; trackId?: TrackId } = {},
): MistakeRecord[] {
  const conditions = ["user_id = ?"];
  const params: Array<string> = [userId];
  if (options.openOnly) conditions.push("resolved_at IS NULL");
  if (options.trackId) {
    conditions.push("track_id = ?");
    params.push(options.trackId);
  }
  const rows = db
    .prepare(
      `SELECT question_id, track_id, wrong_count, last_wrong_at, resolved_at
       FROM mistakes WHERE ${conditions.join(" AND ")}
       ORDER BY resolved_at IS NULL DESC, last_wrong_at DESC`,
    )
    .all(...params) as MistakeRow[];
  return rows.map((row) => ({
    questionId: row.question_id,
    trackId: row.track_id,
    wrongCount: row.wrong_count,
    lastWrongAt: row.last_wrong_at,
    resolvedAt: row.resolved_at,
  }));
}

export function countOpenMistakes(db: Db, userId: string): number {
  const row = db
    .prepare("SELECT COUNT(*) AS total FROM mistakes WHERE user_id = ? AND resolved_at IS NULL")
    .get(userId) as { total: number };
  return row.total;
}

export function recordCodeAttempt(
  db: Db,
  input: {
    id: string;
    userId: string;
    challengeId: string;
    trackId: TrackId;
    language: "javascript" | "kotlin";
    code: string;
    passed: number;
    total: number;
    createdAt: string;
  },
): void {
  db.prepare(
    `INSERT INTO code_attempts (id, user_id, challenge_id, track_id, language, code, passed, total, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    input.id,
    input.userId,
    input.challengeId,
    input.trackId,
    input.language,
    input.code,
    input.passed,
    input.total,
    input.createdAt,
  );
}

export function hasCodeAttempt(db: Db, userId: string, challengeId: string): boolean {
  const row = db
    .prepare("SELECT 1 AS found FROM code_attempts WHERE user_id = ? AND challenge_id = ? LIMIT 1")
    .get(userId, challengeId) as { found: number } | undefined;
  return Boolean(row);
}

export function getLatestCodeAttempt(
  db: Db,
  userId: string,
  challengeId: string,
): { passed: number; total: number; createdAt: string } | null {
  const row = db
    .prepare(
      `SELECT passed, total, created_at FROM code_attempts
       WHERE user_id = ? AND challenge_id = ? ORDER BY created_at DESC LIMIT 1`,
    )
    .get(userId, challengeId) as { passed: number; total: number; created_at: string } | undefined;
  return row ? { passed: row.passed, total: row.total, createdAt: row.created_at } : null;
}

export function getPassedChallengeIds(db: Db, userId: string, trackId?: TrackId): Set<string> {
  const rows = trackId
    ? (db
        .prepare(
          `SELECT challenge_id, MAX(CASE WHEN passed = total AND total > 0 THEN 1 ELSE 0 END) AS passed
           FROM code_attempts WHERE user_id = ? AND track_id = ?
           GROUP BY challenge_id HAVING passed = 1`,
        )
        .all(userId, trackId) as Array<{ challenge_id: string }>)
    : (db
        .prepare(
          `SELECT challenge_id, MAX(CASE WHEN passed = total AND total > 0 THEN 1 ELSE 0 END) AS passed
           FROM code_attempts WHERE user_id = ?
           GROUP BY challenge_id HAVING passed = 1`,
        )
        .all(userId) as Array<{ challenge_id: string }>);
  return new Set(rows.map((row) => row.challenge_id));
}

export function countCodeAttempts(db: Db, userId: string): number {
  const row = db
    .prepare("SELECT COUNT(*) AS total FROM code_attempts WHERE user_id = ?")
    .get(userId) as { total: number };
  return row.total;
}
