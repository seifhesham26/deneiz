import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Node by default so pure-logic suites stay fast; component tests opt into
    // the DOM with a `// @vitest-environment jsdom` docblock at the top of the
    // file. Previously `.tsx` was excluded outright, so they could not run.
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
