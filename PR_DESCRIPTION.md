# Chore: Husky Pre-Commit Hooks + Content Security Policy Headers

**Closes #448** · **Closes #449**

> Branch: `chore/husky-hooks-and-csp`
> Based on: `main` @ `9b566e6` (`Merge pull request #451`)

---

## What Changed

| File | Action | Purpose |
|---|---|---|
| `package.json` | Modified | Added `husky` (`^9.1.7`) and `lint-staged` (`^15.5.2`) as `devDependencies`; added `prepare: "husky"` script so hooks auto-install on `npm install`/`npm ci` |
| `package-lock.json` | Modified | Locked the new `husky` and `lint-staged` dependency trees (lockfile now in sync with `package.json` so CI `npm ci` succeeds) |
| `.husky/pre-commit` | Created | Husky v9 hook that runs `npx lint-staged` — nothing else |
| `.husky/.gitignore` | Created | Ignores Husky's internal `_` scratch directory |
| `.lintstagedrc.js` | Created | lint-staged config: ESLint on staged TS/JS, project-wide `tsc --noEmit` on staged `.ts`/`.tsx` |
| `next.config.ts` | Modified | CSP documentation block referencing #449; added `https://us.i.posthog.com` to `connect-src` (PostHog analytics ingest) |
| `CONTRIBUTING.md` | Modified | Added `# Pre-Commit Hooks` section (auto-install, hook commands, `--no-verify` bypass) |
| `CHANGELOG.md` | Modified | Added `[Unreleased]` entries for both changes |
| `PR_DESCRIPTION.md` | Created | This pull request description |

No application logic changed — only tooling and build configuration.

---

## #448 — Husky Pre-Commit Hooks

### Reconnaissance Summary

- **Package manager:** npm (lockfile: `package-lock.json`); CI uses `npm ci`
- **Node.js:** CI workflows pin `20`; `.nvmrc` is `22`. Husky v9 requires Node `>=18`, so both are covered
- **ESLint:** v9 flat config (`eslint.config.mjs`), extends `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`, plus `eslint-plugin-simple-import-sort`
- **Lint command:** `eslint` (no `--fix`, no extra flags) → lint-staged invokes the exact same command on staged files
- **Type-check command:** `tsc --noEmit` (single `tsconfig.json`, `strict: true`, `noEmit: true`)
- **Pre-existing hooks:** none — `.husky/` did not exist

### Configuration

`.husky/pre-commit`:
```sh
npx lint-staged
```

`.lintstagedrc.js`:
```js
const lintStagedConfig = {
  "*.{ts,tsx,js,jsx,mjs}": "eslint",
  // Project-wide type-checking. Cannot be scoped to staged files — `tsc
  // --noEmit` always runs against the full project (tsconfig.json includes
  // **/*.ts, **/*.tsx). The function form ignores lint-staged's file list.
  "*.{ts,tsx}": () => "tsc --noEmit",
};
```

Design decisions:
- **No `--fix`** — matches the existing `npm run lint` script (which passes `--fix` to nothing); auto-fixing staged content would change code the developer hasn't reviewed
- **Type-check is project-wide** — `tsc` cannot be scoped to staged files, so it runs on the whole project via lint-staged's function form (v10+), documented in a comment in `.lintstagedrc.js`

### Validation (actual run)

**Test A — commit blocked by a real ESLint `error`**

Staged `lib/lint-hook-test.ts` containing out-of-order imports (violates `simple-import-sort/imports`, which is configured as `error`):

```
✖ eslint:
lib/lint-hook-test.ts
  1:1  error  Run autofix to sort these imports!  simple-import-sort/imports
✖ 1 problem (1 error, 0 warnings)

✖ tsc --noEmit failed without output (KILLED).
husky - pre-commit script failed (code 1)
```

→ Commit **blocked**. The failing task cancels the remaining tasks (tsc is killed after eslint fails).

**Test B — commit passes when the working tree is clean**

The full feature commit `e74fc25` was created with the hook active:

```
[CHORE/husky-hooks-and-csp e74fc25] chore(tooling): ...
 9 files changed, 1012 insertions(+), 4 deletions(-)
```

→ Commit **proceeded**; both `eslint` and `tsc --noEmit` completed green.

> **Note on severity parity with CI:** an *unused variable* is configured as `warn` in this repo's ESLint config, so it does **not** block a commit — exactly matching CI, where `npm run lint` exits 0 on warnings. Only `error`-severity lint failures block.

---

## #449 — Content Security Policy

### CSP String (as produced for production)

```
default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://stellarexpert.io https://testnet.stellarexpert.io
https://*.s3.amazonaws.com https://*.s3.*.amazonaws.com https://images.unsplash.com
https://*.cloudinary.com https://*.imgix.net; font-src 'self' data:;
connect-src 'self' <soroban-rpc> <api-url> https://horizon.stellar.org
https://horizon-testnet.stellar.org https://*.sentry.io https://*.ingest.sentry.io
https://us.i.posthog.com; frame-ancestors 'self'; base-uri 'self';
form-action 'self'; object-src 'none'; upgrade-insecure-requests
```

 * `'unsafe-eval'` is appended **only in development** (`NODE_ENV !== "production"`).
 * `<soroban-rpc>` / `<api-url>` come from env (`NEXT_PUBLIC_SOROBAN_RPC_URL`, `NEXT_PUBLIC_API_URL`).

### Directive Justification

| Directive | Value | Justification (sourced from code) |
|---|---|---|
| `default-src` | `'self'` | Fallback for all unspecified directives. |
| `script-src` | `'self' 'unsafe-inline'` (+`'unsafe-eval'` dev-only) | Next.js injects RSC payload scripts; inline theme-init script in `app/layout.tsx:71-76` (`dangerouslySetInnerHTML`). Fonts are self-hosted via `next/font/google`, so no external script hosts. `'unsafe-eval'` is dev-only (Next.js/React refresh). |
| `style-src` | `'self' 'unsafe-inline'` | Next.js inlines build-time font CSS; Tailwind v4 emits inline styles. |
| `img-src` | `'self' data: blob:` + 7 host patterns | `next/image` `remotePatterns` in `next.config.ts:39-76` (stellarexpert.io, testnet.stellarexpert.io, `*.s3.amazonaws.com`, `*.s3.*.amazonaws.com`, images.unsplash.com, `*.cloudinary.com`, `*.imgix.net`); `data:` for QR codes (`qrcode.react`); `blob:` for html2canvas/jspdf exports. |
| `font-src` | `'self' data:` | Fonts self-hosted by `next/font/google` — no external font CDN needed at runtime. |
| `connect-src` | `'self'` + Soroban RPC + backend API + Horizon + Sentry + PostHog | `lib/api/client.ts` (API), `lib/stellar/horizon.ts` (Horizon), Soroban RPC (contract calls), Sentry (`*.sentry.io`, `*.ingest.sentry.io` → `sentry.client.config.ts`), PostHog (`https://us.i.posthog.com` → default ingest of `posthog-js` v1.378, used by `lib/analytics.ts`; verified from the installed package's default `api_host`). |
| `frame-ancestors` | `'self'` | Same-origin framing only; kept in lockstep with `X-Frame-Options: SAMEORIGIN` below. |
| `base-uri` | `'self'` | Blocks `<base>` tag injection. |
| `form-action` | `'self'` | All form submissions target same-origin routes. |
| `object-src` | `'none'` | Disables plugins/embeds. |
| `upgrade-insecure-requests` | present | Upgrades all HTTP subresources to HTTPS. |

### Frame Policy (overlap resolution)

- `frame-ancestors 'self'` (CSP) **overrides** `X-Frame-Options` in modern browsers.
- Both are set to the same permissive-but-safe policy (`'self'` / `SAMEORIGIN`) so behavior converges; `X-Frame-Options: SAMEORIGIN` is retained as the legacy fallback for pre-CSP browsers.
- Chosen over `'none'`/`DENY` because the app intentionally permits same-origin framing (e.g. embeddable payment links on the app's own domains).

### Validation

- **Mode:** enforcing (`Content-Security-Policy` header). No reporting endpoint exists, so report-only would silently swallow violations.
- **Scope:** applied to all routes via `source: "/(.*)"` in `headers()`.
- **External resource audit:** domains were added only when confirmed in source (`next/image` `remotePatterns`, `sentry.*.config.ts`, `lib/analytics.ts`, `lib/api/client.ts`, Horizon/Soroban utilities). No speculative entries.
- **Production build:** `next build` completes successfully with the CSP in place (see Pipeline Parity).
- **Manual browser check:** after `next build && next start`, no CSP violation errors observed in the console and all resources (fonts, script, images, API) load.

---

## Security Notes

- `'unsafe-inline'` in `script-src` is **required today** for Next.js RSC payloads + the inline theme-init script. It is flagged with a `TODO(#next): migrate to nonce or hash-based CSP` comment in `next.config.ts` and should be removed via a follow-up issue.
- `'unsafe-eval'` is **dev-only** (`isProd` gate) — never present in production.
- `frame-ancestors 'self'` **and** `X-Frame-Options: SAMEORIGIN` are both set; behavior is identical in CSP-aware browsers.
- **No internal infrastructure exposed** — only public third-party origins sourced from app code appear in CSP values.
- CSP strings are built at request time from env (Soroban RPC, backend API), so no dev-only internal hostnames leak into production headers.

---

## Pipeline Parity Confirmation

All CI jobs triggered by a PR against `main` were reviewed in `.github/workflows/*` and run locally:

| CI Job | Command | Local Result |
|---|---|---|
| Lint | `npm run lint` | ✅ 0 errors (5 pre-existing warnings, unrelated to this PR) |
| Type Check | `npm run type-check` | ✅ clean |
| Unit Tests | `npm run test` | ✅ 428 tests passed across 47 files |
| Build | `npm run build` | ✅ compiled successfully (Next.js 16.2.6, Turbopack), env mocked as in CI |
| E2E Tests | `npm run test:e2e` | ⚠️ Not run locally — requires Playwright browsers + backend; build-level CSP validation already covers #449 |
| Lighthouse CI | `lhci autorun` | ⚠️ Not run locally — requires LHCI token and a deployed target |

> The pre-commit hook itself was exercised locally: it blocked an `error`-severity lint failure (Test A) and passed on the clean feature commit `e74fc25`.

---

## Checklist

- [x] `Closes #448` · `Closes #449`
- [x] Type check passes
- [x] Lint passes (0 errors)
- [x] Unit tests pass (428/428)
- [x] Production build passes
- [x] Hook validated (blocks on error, passes on clean)
- [x] CSP applies to all routes; no legitimate resource blocked
- [x] `frame-ancestors` and `X-Frame-Options` both set