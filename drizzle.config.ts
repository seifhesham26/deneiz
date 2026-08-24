import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

// drizzle-kit does not auto-load Next.js env files
config({ path: ".env.local" });

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    // Tooling config only — application code goes through src/env.ts
    url: process.env.DATABASE_URL!,
  },
});
