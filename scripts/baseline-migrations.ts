/**
 * Marks already-applied migrations as applied, without running their SQL.
 *
 * This database was built with `drizzle-kit push`, so every table exists but
 * drizzle has no migration history. The first migration (0000) is a full
 * CREATE TABLE baseline with no IF NOT EXISTS, so `db:migrate` would abort on
 * the first statement. Recording 0000 as applied lets 0001 onward run normally.
 *
 * Reports what it would do by default. Pass --apply to write.
 *
 * Run: npx tsx scripts/baseline-migrations.ts [--apply] [--tag 0000_name]
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { getDb } from "../src/db";

config({ path: ".env.local" });

const APPLY = process.argv.includes("--apply");
const MIGRATIONS_DIR = path.join(process.cwd(), "src", "db", "migrations");

/** Default: only the initial baseline. `push` never applied anything later. */
const tagArgument = process.argv.indexOf("--tag");
const REQUESTED_TAG = tagArgument === -1 ? null : process.argv[tagArgument + 1];

interface JournalEntry {
  tag: string;
  when: number;
}

async function main() {
  const journal = JSON.parse(
    readFileSync(path.join(MIGRATIONS_DIR, "meta", "_journal.json"), "utf8"),
  ) as { entries: JournalEntry[] };

  const entries = REQUESTED_TAG
    ? journal.entries.filter((entry) => entry.tag === REQUESTED_TAG)
    : journal.entries.slice(0, 1);

  if (!entries.length) {
    console.error(`No journal entry matched ${REQUESTED_TAG ?? "index 0"}.`);
    process.exit(1);
  }

  const db = getDb();

  // Same shape drizzle's own migrator creates, so it recognises what we write
  if (APPLY) {
    await db.execute(sql`CREATE SCHEMA IF NOT EXISTS "drizzle"`);
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS "drizzle"."__drizzle_migrations" (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);
  }

  for (const entry of entries) {
    // drizzle hashes the whole file, not the individual statements
    const fileContents = readFileSync(path.join(MIGRATIONS_DIR, `${entry.tag}.sql`), "utf8");
    const hash = createHash("sha256").update(fileContents).digest("hex");

    const existing = APPLY
      ? await db.execute(
          sql`select 1 from "drizzle"."__drizzle_migrations" where hash = ${hash} limit 1`,
        )
      : { rows: [] as unknown[] };

    if (existing.rows.length) {
      console.log(`SKIP  ${entry.tag} — already recorded`);
      continue;
    }

    console.log(`MARK  ${entry.tag} as applied (hash ${hash.slice(0, 12)}…, when ${entry.when})`);

    if (APPLY) {
      await db.execute(sql`
        insert into "drizzle"."__drizzle_migrations" ("hash", "created_at")
        values (${hash}, ${entry.when})
      `);
    }
  }

  console.log(
    `\n${APPLY ? "Applied" : "DRY RUN"} — ${entries.length} migration(s) marked as already applied.`,
  );
  if (!APPLY) {
    console.log("Re-run with --apply, then `npm run db:migrate` for the rest.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
