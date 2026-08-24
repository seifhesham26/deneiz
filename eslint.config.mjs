import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/**
 * The CLAUDE.md conventions are enforced here rather than by review. Every rule
 * below corresponds to a class of defect that had already accumulated in the
 * codebase before it was machine-checked.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "no-restricted-globals": [
        "error",
        {
          name: "confirm",
          message: "Use the Modal primitive — native dialogs are unstyled and untranslatable.",
        },
        {
          name: "alert",
          message: "Use pushToast or Modal — native dialogs cannot be translated.",
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "MemberExpression[object.name='process'][property.name='env']",
          message: "Read configuration through src/env.ts, never process.env directly.",
        },
        {
          selector:
            "Literal[value=/(^|\\s)(bg|text|border|from|to|via|ring|fill|stroke)-(white|black)(\\/|\\s|$)/]",
          message:
            "Colors live in app/globals.css as tokens — use bg-surface, text-text-inverse, etc.",
        },
        {
          selector: "Literal[value=/#[0-9a-fA-F]{3,8}(\\s|$)/]",
          message: "No hex colors outside app/globals.css.",
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    // scripts/ runs outside Next; src/env.ts IS the typed wrapper the rule points at
    files: ["scripts/**/*.ts", "*.config.{ts,mjs}", "drizzle.config.ts", "src/env.ts"],
    rules: { "no-restricted-syntax": "off" },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // globals.css is the single owner of color and is not JavaScript
    "**/*.css",
  ]),
]);

export default eslintConfig;
