import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dbCredentials: {
    // Tooling config only — application code goes through src/env.ts
    url: process.env.DATABASE_URL!,
  },
});
