import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { migrate } from "./schema";

export type Db = Database.Database;

export function resolveDbPath(): string {
  const configured = process.env.DATABASE_PATH;
  if (configured) return path.resolve(process.cwd(), configured);
  return path.resolve(process.cwd(), "data", "offerpath.db");
}

export function openDatabase(filePath = resolveDbPath()): Db {
  if (filePath !== ":memory:") fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const db = new Database(filePath);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.pragma("busy_timeout = 5000");
  migrate(db);
  return db;
}

let singleton: Db | null = null;

export function getDb(): Db {
  if (!singleton) singleton = openDatabase();
  return singleton;
}
