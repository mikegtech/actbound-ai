/**
 * Database migration runner.
 * Reads SQL files from migrations/ and executes them against the database.
 *
 * Usage: DATABASE_URL=... tsx src/infrastructure/database/migrate.ts
 */

import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import pg from "pg";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("[migrate] DATABASE_URL not set");
    process.exit(1);
  }

  const client = new pg.Client({ connectionString: url });
  await client.connect();

  console.log("[migrate] Connected to database");

  const migrationsDir = resolve(__dirname, "../../../migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  for (const file of files) {
    const sql = readFileSync(resolve(migrationsDir, file), "utf-8");
    console.log(`[migrate] Running: ${file}`);
    await client.query(sql);
    console.log(`[migrate] Done: ${file}`);
  }

  await client.end();
  console.log("[migrate] All migrations complete");
}

main().catch((err) => {
  console.error("[migrate] Failed:", err);
  process.exit(1);
});
