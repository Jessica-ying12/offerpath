import type { Database } from "better-sqlite3";

const MIGRATION_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

CREATE TABLE IF NOT EXISTS profiles (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('junior','middle','senior')),
  target_role TEXT NOT NULL DEFAULT '',
  target_company TEXT NOT NULL DEFAULT '',
  resume_text TEXT NOT NULL DEFAULT '',
  jd_text TEXT NOT NULL DEFAULT '',
  onboarded INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS lesson_progress (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  atom_id TEXT NOT NULL,
  chapter_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  PRIMARY KEY (user_id, atom_id)
);
CREATE INDEX IF NOT EXISTS idx_lesson_progress_user_track ON lesson_progress(user_id, track_id);

CREATE TABLE IF NOT EXISTS quiz_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL CHECK (source_type IN ('chapter','mistake')),
  source_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('junior','middle','senior')),
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  details_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_time ON quiz_attempts(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS mistakes (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  wrong_count INTEGER NOT NULL DEFAULT 1,
  last_wrong_at TEXT NOT NULL,
  resolved_at TEXT,
  PRIMARY KEY (user_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_mistakes_user_open ON mistakes(user_id, resolved_at);

CREATE TABLE IF NOT EXISTS code_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  language TEXT NOT NULL CHECK (language IN ('javascript','kotlin','sql')),
  code TEXT NOT NULL,
  passed INTEGER NOT NULL,
  total INTEGER NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_code_attempts_user ON code_attempts(user_id, challenge_id, created_at DESC);

CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('sprint','career')),
  track_id TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('junior','middle','senior')),
  title TEXT NOT NULL,
  input_json TEXT NOT NULL,
  plan_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_plans_user_time ON plans(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS interview_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL,
  level TEXT NOT NULL CHECK (level IN ('junior','middle','senior')),
  mode TEXT NOT NULL CHECK (mode IN ('resume','jd','position')),
  status TEXT NOT NULL CHECK (status IN ('active','completed')),
  plan_json TEXT NOT NULL,
  summary_json TEXT,
  created_at TEXT NOT NULL,
  ended_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_time ON interview_sessions(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS interview_turns (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  seq INTEGER NOT NULL,
  question_id TEXT NOT NULL,
  parent_id TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('main','retry','followup')),
  question_text TEXT NOT NULL,
  answer TEXT NOT NULL,
  score INTEGER NOT NULL,
  feedback_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (session_id, seq)
);
CREATE INDEX IF NOT EXISTS idx_interview_turns_session ON interview_turns(session_id, seq);

CREATE TABLE IF NOT EXISTS activities (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  meta_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_activities_user_time ON activities(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS chapter_mastery (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  stage INTEGER NOT NULL DEFAULT 1 CHECK (stage BETWEEN 1 AND 5),
  review_count INTEGER NOT NULL DEFAULT 0,
  next_review_at TEXT,
  last_review_at TEXT,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (user_id, chapter_id)
);
CREATE INDEX IF NOT EXISTS idx_mastery_due ON chapter_mastery(user_id, next_review_at);

CREATE TABLE IF NOT EXISTS review_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  chapter_id TEXT NOT NULL,
  track_id TEXT NOT NULL,
  level TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  details_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_review_attempts_user_time ON review_attempts(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS bank_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scope_json TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  details_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_bank_attempts_user_time ON bank_attempts(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS exam_attempts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  track_id TEXT NOT NULL,
  level TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  details_json TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_exam_attempts_user_time ON exam_attempts(user_id, created_at DESC);
`;

export function migrate(db: Database): void {
  db.exec(MIGRATION_SQL);
}
