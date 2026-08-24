import { Pool } from "@neondatabase/serverless";
import { drizzle, type NeonDatabase } from "drizzle-orm/neon-serverless";
import { env } from "@/env";
import * as schema from "./schema";

export type AppDatabase = NeonDatabase<typeof schema>;

/**
 * WebSocket pool rather than the HTTP driver: neon-http throws on
 * transaction(), and checkout, stock adjustment and product writes all need
 * real interactive transactions. Node 18+ exposes a global WebSocket, so no
 * neonConfig.webSocketConstructor and no `ws` dependency are required.
 */
const POOL_MAX_CONNECTIONS = 5;

// Hot reload re-evaluates modules; without a global pin dev would leak a pool
// per reload until Postgres refuses new connections.
const globalForDb = globalThis as unknown as { deneizDb?: AppDatabase };

/**
 * Lazily constructed so importing this module never requires DATABASE_URL —
 * otherwise `next build` prerendering would fail without credentials.
 */
export function getDb(): AppDatabase {
  globalForDb.deneizDb ??= drizzle(
    new Pool({ connectionString: env.databaseUrl, max: POOL_MAX_CONNECTIONS }),
    { schema },
  );
  return globalForDb.deneizDb;
}
