import type { Db } from "./client";
import type { LevelId, TrackId } from "@/lib/content/schema";
import type {
  InterviewFeedback,
  InterviewMode,
  InterviewPlanSnapshot,
  InterviewSessionRecord,
  InterviewSummary,
  InterviewTurn,
} from "@/lib/types";

type SessionRow = {
  id: string;
  user_id: string;
  track_id: TrackId;
  level: LevelId;
  mode: InterviewMode;
  status: "active" | "completed";
  plan_json: string;
  summary_json: string | null;
  created_at: string;
  ended_at: string | null;
};

type TurnRow = {
  id: string;
  session_id: string;
  seq: number;
  question_id: string;
  parent_id: string | null;
  kind: "main" | "retry" | "followup";
  question_text: string;
  answer: string;
  score: number;
  feedback_json: string;
  created_at: string;
};

function mapSession(row: SessionRow): InterviewSessionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    trackId: row.track_id,
    level: row.level,
    mode: row.mode,
    status: row.status,
    plan: JSON.parse(row.plan_json) as InterviewPlanSnapshot,
    summary: row.summary_json ? (JSON.parse(row.summary_json) as InterviewSummary) : null,
    createdAt: row.created_at,
    endedAt: row.ended_at,
  };
}

function mapTurn(row: TurnRow): InterviewTurn {
  return {
    id: row.id,
    sessionId: row.session_id,
    seq: row.seq,
    questionId: row.question_id,
    parentId: row.parent_id,
    kind: row.kind,
    questionText: row.question_text,
    answer: row.answer,
    score: row.score,
    feedback: JSON.parse(row.feedback_json) as InterviewFeedback,
    createdAt: row.created_at,
  };
}

export function createInterviewSession(
  db: Db,
  input: {
    id: string;
    userId: string;
    trackId: TrackId;
    level: LevelId;
    mode: InterviewMode;
    plan: InterviewPlanSnapshot;
    createdAt: string;
  },
): void {
  db.prepare(
    `INSERT INTO interview_sessions (id, user_id, track_id, level, mode, status, plan_json, created_at)
     VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
  ).run(
    input.id,
    input.userId,
    input.trackId,
    input.level,
    input.mode,
    JSON.stringify(input.plan),
    input.createdAt,
  );
}

export function getInterviewSession(
  db: Db,
  userId: string,
  id: string,
): InterviewSessionRecord | null {
  const row = db
    .prepare("SELECT * FROM interview_sessions WHERE id = ? AND user_id = ?")
    .get(id, userId) as SessionRow | undefined;
  return row ? mapSession(row) : null;
}

export function listInterviewSessions(
  db: Db,
  userId: string,
  limit = 20,
): InterviewSessionRecord[] {
  const rows = db
    .prepare(
      "SELECT * FROM interview_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
    )
    .all(userId, limit) as SessionRow[];
  return rows.map(mapSession);
}

export function getInterviewTurns(db: Db, sessionId: string): InterviewTurn[] {
  const rows = db
    .prepare("SELECT * FROM interview_turns WHERE session_id = ? ORDER BY seq ASC")
    .all(sessionId) as TurnRow[];
  return rows.map(mapTurn);
}

export function insertInterviewTurn(
  db: Db,
  input: {
    id: string;
    sessionId: string;
    seq: number;
    questionId: string;
    parentId: string | null;
    kind: "main" | "retry" | "followup";
    questionText: string;
    answer: string;
    score: number;
    feedback: InterviewFeedback;
    createdAt: string;
  },
): void {
  db.prepare(
    `INSERT INTO interview_turns (
       id, session_id, seq, question_id, parent_id, kind, question_text, answer,
       score, feedback_json, created_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    input.id,
    input.sessionId,
    input.seq,
    input.questionId,
    input.parentId,
    input.kind,
    input.questionText,
    input.answer,
    input.score,
    JSON.stringify(input.feedback),
    input.createdAt,
  );
}

export function completeInterviewSession(
  db: Db,
  input: {
    userId: string;
    id: string;
    summary: InterviewSummary;
    endedAt: string;
  },
): boolean {
  const result = db
    .prepare(
      `UPDATE interview_sessions SET status = 'completed', summary_json = ?, ended_at = ?
       WHERE id = ? AND user_id = ? AND status = 'active'`,
    )
    .run(JSON.stringify(input.summary), input.endedAt, input.id, input.userId);
  return result.changes > 0;
}

export function countCompletedInterviews(db: Db, userId: string): number {
  const row = db
    .prepare(
      "SELECT COUNT(*) AS total FROM interview_sessions WHERE user_id = ? AND status = 'completed'",
    )
    .get(userId) as { total: number };
  return row.total;
}

export function hasCompletedInterviewSince(
  db: Db,
  userId: string,
  options: { trackId: TrackId; since: string; level?: LevelId },
): boolean {
  const conditions = ["user_id = ?", "track_id = ?", "status = 'completed'", "created_at >= ?"];
  const params: string[] = [userId, options.trackId, options.since];
  if (options.level) {
    conditions.push("level = ?");
    params.push(options.level);
  }
  const row = db
    .prepare(`SELECT 1 AS found FROM interview_sessions WHERE ${conditions.join(" AND ")} LIMIT 1`)
    .get(...params) as { found: number } | undefined;
  return Boolean(row);
}
