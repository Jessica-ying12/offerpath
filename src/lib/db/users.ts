import type { Db } from "./client";
import type { Profile, User } from "@/lib/types";

type UserRow = {
  id: string;
  email: string;
  name: string;
  password_hash: string;
  created_at: string;
};

type ProfileRow = {
  user_id: string;
  track_id: Profile["trackId"];
  level: Profile["level"];
  target_role: string;
  target_company: string;
  resume_text: string;
  jd_text: string;
  onboarded: number;
  created_at: string;
  updated_at: string;
};

function mapUser(row: UserRow): User {
  return { id: row.id, email: row.email, name: row.name, createdAt: row.created_at };
}

function mapProfile(row: ProfileRow): Profile {
  return {
    userId: row.user_id,
    trackId: row.track_id,
    level: row.level,
    targetRole: row.target_role,
    targetCompany: row.target_company,
    resumeText: row.resume_text,
    jdText: row.jd_text,
    onboarded: row.onboarded === 1,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createUser(
  db: Db,
  input: { id: string; email: string; name: string; passwordHash: string; createdAt: string },
): void {
  db.prepare(
    "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(input.id, input.email, input.name, input.passwordHash, input.createdAt);
}

export function findUserWithPassword(
  db: Db,
  email: string,
): (User & { passwordHash: string }) | null {
  const row = db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(email) as UserRow | undefined;
  if (!row) return null;
  return { ...mapUser(row), passwordHash: row.password_hash };
}

export function findUserById(db: Db, id: string): User | null {
  const row = db.prepare("SELECT * FROM users WHERE id = ?").get(id) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export function createSession(
  db: Db,
  input: { tokenHash: string; userId: string; expiresAt: string; createdAt: string },
): void {
  db.prepare(
    "INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)",
  ).run(input.tokenHash, input.userId, input.expiresAt, input.createdAt);
}

export function findUserBySession(
  db: Db,
  tokenHash: string,
  nowIso: string,
): User | null {
  const row = db
    .prepare(
      `SELECT u.* FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(tokenHash, nowIso) as UserRow | undefined;
  return row ? mapUser(row) : null;
}

export function deleteSession(db: Db, tokenHash: string): void {
  db.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
}

export function deleteExpiredSessions(db: Db, nowIso: string): void {
  db.prepare("DELETE FROM sessions WHERE expires_at <= ?").run(nowIso);
}

export function updateUserName(db: Db, userId: string, name: string): void {
  db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name, userId);
}

export function getProfile(db: Db, userId: string): Profile | null {
  const row = db.prepare("SELECT * FROM profiles WHERE user_id = ?").get(userId) as
    | ProfileRow
    | undefined;
  return row ? mapProfile(row) : null;
}

export function saveProfile(db: Db, profile: Profile): void {
  db.prepare(
    `INSERT INTO profiles (
       user_id, track_id, level, target_role, target_company, resume_text, jd_text,
       onboarded, created_at, updated_at
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       track_id = excluded.track_id,
       level = excluded.level,
       target_role = excluded.target_role,
       target_company = excluded.target_company,
       resume_text = excluded.resume_text,
       jd_text = excluded.jd_text,
       onboarded = excluded.onboarded,
       updated_at = excluded.updated_at`,
  ).run(
    profile.userId,
    profile.trackId,
    profile.level,
    profile.targetRole,
    profile.targetCompany,
    profile.resumeText,
    profile.jdText,
    profile.onboarded ? 1 : 0,
    profile.createdAt,
    profile.updatedAt,
  );
}
