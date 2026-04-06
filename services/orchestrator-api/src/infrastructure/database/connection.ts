/**
 * Database connection — infrastructure layer only.
 *
 * Uses pg driver + Drizzle ORM. Connection is lazy-initialized.
 * Falls back gracefully if DATABASE_URL is not set (in-memory audit only).
 */

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (db) return db;

  const url = process.env.DATABASE_URL;
  if (!url) return null;

  const pool = new pg.Pool({ connectionString: url });
  db = drizzle(pool, { schema });
  return db;
}

export type AppDb = NonNullable<ReturnType<typeof getDb>>;
