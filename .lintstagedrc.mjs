const lintStagedConfig = {
  // tsc is project-wide, so it ignores the staged file list by design — a
  // type error anywhere still blocks the commit, which is the point
  "*.{ts,tsx}": [
    "eslint --fix --max-warnings=0",
    () => "tsc --noEmit",
    () => "vitest run",
  ],
};

export default lintStagedConfig;
