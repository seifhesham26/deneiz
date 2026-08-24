import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import { env } from "@/env";
import * as schema from "./schema";

export type AppDatabase = NeonHttpDatabase<typeof schema>;

let cachedDb: AppDatabase | undefined;

/**
 * Lazily constructed so importing this module never requires DATABASE_URL —
 * otherwise `next build` prerendering would fail without credentials.
 */
export function getDb(): AppDatabase {
  if (!cachedDb) {
    const sql = neon(env.databaseUrl);
    cachedDb = drizzle(sql, { schema });
  }
  return cachedDb;
}
