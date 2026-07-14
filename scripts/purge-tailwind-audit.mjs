/**
 * PurgeCSS audit for unused Tailwind/CSS selectors (issue #287).
 *
 * 1. Compiles app/globals.css with the Tailwind CLI.
 * 2. Runs PurgeCSS against application source (excluding stories/tests).
 * 3. Reports compiled vs purged bundle size.
 *
 * Usage: npm run audit:tailwind
 */
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PurgeCSS } from "purgecss";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const auditDir = join(root, ".audit");
const inputCss = join(root, "app", "globals.css");
const compiledCss = join(auditDir, "tailwind-compiled.css");
const purgedCss = join(auditDir, "tailwind-purged.css");

/** Mirrors @source paths in app/globals.css */
const contentGlobs = [
  "app/**/*.{js,ts,jsx,tsx,mdx}",
  "components/**/*.{js,ts,jsx,tsx}",
  "src/**/*.{js,ts,jsx,tsx}",
  "hooks/**/*.{js,ts,jsx,tsx}",
  "lib/**/*.{js,ts,jsx,tsx}",
  "utils/**/*.{js,ts,jsx,tsx}",
].map((glob) => join(root, glob).replace(/\\/g, "/"));

const safelist = [
  "dark",
  "light",
  "animate-float",
  /^data-/,
  /^sonner/,
  /^\[/,
  /^focus:/,
  /^hover:/,
  /^dark:/,
  /^sm:/,
  /^md:/,
  /^lg:/,
  /^xl:/,
];

mkdirSync(auditDir, { recursive: true });

execSync(`npx @tailwindcss/cli -i "${inputCss}" -o "${compiledCss}"`, {
  cwd: root,
  stdio: "inherit",
  env: { ...process.env, NODE_OPTIONS: "--max-old-space-size=4096" },
});

const before = readFileSync(compiledCss, "utf8");
const beforeBytes = Buffer.byteLength(before, "utf8");

const [{ css: after }] = await new PurgeCSS().purge({
  content: contentGlobs,
  css: [{ raw: before }],
  safelist,
  defaultExtractor: (content) => content.match(/[\w-/:.\[\]%!]+(?<!:)/g) ?? [],
});

writeFileSync(purgedCss, after);
const afterBytes = Buffer.byteLength(after, "utf8");
const saved = beforeBytes - afterBytes;
const pct = beforeBytes ? ((saved / beforeBytes) * 100).toFixed(1) : "0.0";

console.log("\n--- Tailwind PurgeCSS audit (issue #287) ---");
console.log(`Compiled CSS:  ${(beforeBytes / 1024).toFixed(1)} KiB`);
console.log(`After purge:   ${(afterBytes / 1024).toFixed(1)} KiB`);
console.log(`Removed:       ${(saved / 1024).toFixed(1)} KiB (${pct}%)`);
console.log(`Reports saved: ${compiledCss}`);
console.log(`               ${purgedCss}`);

if (saved <= 0) {
  console.log("No unused selectors detected — content scanning is already tight.");
} else {
  console.log(
    "Tailwind JIT already tree-shakes utilities; remaining gap is mostly variant permutations.",
  );
}
