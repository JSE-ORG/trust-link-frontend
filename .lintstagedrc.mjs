const lintStagedConfig = {
  "*.{ts,tsx,js,jsx,mjs}": "eslint",
  // Project-wide type-checking. Cannot be scoped to staged files — `tsc
  // --noEmit` always runs against the full project (tsconfig.json includes
  // **/*.ts, **/*.tsx). The function form ignores lint-staged's file list.
  "*.{ts,tsx}": () => "tsc --noEmit",
};

export default lintStagedConfig;