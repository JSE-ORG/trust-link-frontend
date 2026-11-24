# Environment Variables Reference & Defaults Guide

This document is the root reference for every environment variable read across the TrustLink frontend codebase, kept in sync with [`.env.example`](.env.example). See also the extended architectural guide in [`docs/ENV_VARS.md`](docs/ENV_VARS.md).

---

## Quick Start

Copy [`.env.example`](.env.example) to `.env.local` and review the 4 required build/startup variables:

```bash
cp .env.example .env.local
```

Both [`next.config.ts`](next.config.ts) (on `next dev` / `next build`) and [`env-validation.js`](env-validation.js) (when run via `node env-validation.js`) load `.env*` files with `@next/env` and abort startup if any of these 4 variables are missing or empty:

- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_CONTRACT_ID`
- `NEXT_PUBLIC_STELLAR_NETWORK`
- `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE`

---

## Client Exposure (`NEXT_PUBLIC_`) vs. Server-Only Secrets

Next.js treats environment variables differently depending on their prefix:

| Scope | Prefix Rule | Bundle Behavior | Security Rule |
| :--- | :--- | :--- | :--- |
| **Client & Server (Public)** | Must start with `NEXT_PUBLIC_` | Statically inlined into browser JavaScript bundles at build time (must be read via literal `process.env.NEXT_PUBLIC_*` in client code, e.g. `lib/api/client.ts`). | **Never store secrets, private keys, or internal tokens** in `NEXT_PUBLIC_*` variables — anyone can inspect them in browser DevTools. |
| **Server-Only** | No `NEXT_PUBLIC_` prefix | Available only in Node.js / Edge server contexts (`next.config.ts`, API routes, Server Components, scripts); evaluates to `undefined` in client components. | Use for credentials and internal flags (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RATE_LIMIT_FAIL_CLOSED`, `SENTRY_AUTH_TOKEN`, `SENTRY_TRACES_SAMPLE_RATE`, `ENABLE_VISUAL_TEST_ROUTES`). Never add `NEXT_PUBLIC_` to these keys. |

---

## Variables by Category

### 1. API & Site URLs

| Variable Name | Required / Optional | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | **Required** | None (`http://127.0.0.1:3000/api` in `playwright.config.ts`; `http://localhost:3000/api` in `vitest.setup.ts`) | Base URL for the TrustLink backend REST API. Validated at startup in `next.config.ts` and `env-validation.js`, whitelisted in CSP `connect-src` and `Link` preconnect headers (`next.config.ts`), normalized by `lib/api/client.ts` (throws `ApiConfigurationError` if missing/blank), and read in `app/pay/[escrowId]/PaymentClient.tsx`. |
| `NEXT_PUBLIC_SITE_URL` | Optional | `https://trustlink.app` | Canonical public site origin used in `app/sitemap.ts`, `app/robots.ts`, canonical/Open Graph metadata in `app/tracking/page.tsx`, and same-origin payment link checks in `components/payment/PaymentSection.tsx`. When omitted, SEO routes fall back to `https://trustlink.app` and `PaymentSection` checks `window.location.origin` only. |
| `NEXT_PUBLIC_APP_URL` | Optional | `https://trustlink.app` | Base application URL passed to Next.js `metadataBase` in `app/layout.tsx` to resolve relative Open Graph and Twitter metadata URLs. Safely falls back to `https://trustlink.app` when omitted. |

### 2. Stellar & Soroban

| Variable Name | Required / Optional | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_CONTRACT_ID` | **Required** | None (`CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` in `.env.example`; placeholder in `playwright.config.ts`) | Default Soroban escrow smart contract ID (56-character StrKey starting with `C`). Enforced by `next.config.ts` and `env-validation.js`, and used as fallback contract address in `app/pay/[escrowId]/PaymentEscrowClient.tsx` when an escrow record omits `contractAddress`. |
| `NEXT_PUBLIC_STELLAR_NETWORK` | **Required** | None at validation (runtime fallback: `"testnet"`) | Target Stellar network (`"testnet"`, `"mainnet"`, or `"public"`). Enforced by `next.config.ts` and `env-validation.js`. Configures initial network context in `components/providers/NetworkProvider.tsx` and block explorer URLs in `lib/explorer.ts`; omitted runtime reads safely default to `"testnet"`. |
| `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` | **Required** | None (`"Test SDF Network ; September 2015"` in `.env.example` and `playwright.config.ts`) | Stellar network passphrase required for deployment consistency (`"Test SDF Network ; September 2015"` for testnet, `"Public Global Stellar Network ; September 2015"` for mainnet). Validated at startup in `next.config.ts` and `env-validation.js`. |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | Optional | `https://soroban-testnet.stellar.org` | Soroban JSON-RPC endpoint used by `lib/stellar/contract.ts` (`submitPayment`, `invokeSorobanContract`), testnet configuration in `components/providers/NetworkProvider.tsx`, and CSP `connect-src` / `Link` preconnect headers in `next.config.ts`. Safely falls back to `https://soroban-testnet.stellar.org` when omitted. |

### 3. Analytics (PostHog)

| Variable Name | Required / Optional | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional | None (analytics disabled when unset) | PostHog project API key read by `lib/analytics.ts` (`isDisabled()`, `ensureInitialized()`). When omitted or empty, PostHog is not loaded and `track()`, `identify()`, and `resetAnalytics()` safely act as no-ops. |
| `NEXT_PUBLIC_POSTHOG_DISABLED` | Optional | `false` | Kill-switch read by `lib/analytics.ts` (`isDisabled()`). Only the exact string `"true"` disables PostHog event capture even when `NEXT_PUBLIC_POSTHOG_KEY` is set; any other or omitted value leaves analytics active if a key is provided. |

### 4. Error Tracking & Performance (Sentry)

| Variable Name | Required / Optional | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional | None (error reporting disabled when unset) | Sentry Data Source Name read by `sentry.client.config.ts`, `sentry.server.config.ts`, and `sentry.edge.config.ts`. When omitted, Sentry SDK initialization does not transmit events. |
| `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` | Optional | `0.1` | Client/fallback traces sample rate (`0.0` to `1.0`) parsed by `lib/sentry/sampleRate.ts` (`getTracesSampleRate()`). Used across client, server, and edge configs; `undefined`, non-numeric, or out-of-range values fall back to `0.1` (`DEFAULT_TRACES_SAMPLE_RATE`), while an empty string (`""`) parses as `0`. |
| `SENTRY_TRACES_SAMPLE_RATE` | Optional (Server / Edge) | Falls back to `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`, then `0.1` | Server-only override for Sentry traces sample rate (`0.0` to `1.0`) in `lib/sentry/sampleRate.ts`. Takes precedence over `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` in server and edge runtimes; `undefined` falls back to `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`, and non-numeric or out-of-range values fall back to `0.1`. |
| `SENTRY_AUTH_TOKEN` | Optional (Server / Build Secret) | None | Sentry authentication token used by `@sentry/nextjs` (`withSentryConfig` in `next.config.ts`) if source map uploads are enabled at build time (currently `sourcemaps: { disable: true }` in `next.config.ts`). Keep server-only; safe to omit locally. |

### 5. Rate Limiting (Upstash Redis)

| Variable Name | Required / Optional | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| `UPSTASH_REDIS_REST_URL` | Optional (Server Secret) | None (falls back to in-memory rate limiter) | Upstash Redis REST endpoint read by `lib/rateLimit.ts` (`getUpstashLimiter()`). When either `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` is omitted, `lib/rateLimit.ts` safely falls back to a bounded per-process in-memory limiter (`MAX_MEMORY_ENTRIES = 10_000`). |
| `UPSTASH_REDIS_REST_TOKEN` | Optional (Server Secret) | None (falls back to in-memory rate limiter) | Secret Upstash Redis REST authentication token read by `lib/rateLimit.ts`. Must never use `NEXT_PUBLIC_`. When omitted, Upstash is skipped and the in-memory limiter is used. |
| `RATE_LIMIT_FAIL_CLOSED` | Optional (Server) | `false` (fail-open) | Controls outage behavior in `lib/rateLimit.ts` (`checkRateLimit()`) when Upstash Redis is configured and throws an error. Set to `"true"` to reject requests (HTTP `429` via `enforceRateLimit`); when omitted or any other value, fails open using the in-memory fallback while reporting `rate_limit_redis_failure` to Sentry. |

### 6. Development, Mocking & Visual Test Routes

| Variable Name | Required / Optional | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_ESCROW_MOCK_PAYMENTS` | Optional (Dev / Test only) | `false` in code (`true` in `.env.example` for local convenience) | Checked by `isMockPaymentsEnabled()` in `lib/stellar/contract.ts`. When `"true"`, `submitPayment()` returns a deterministic `mock-...` hash without calling Soroban RPC. When omitted, defaults to live payments (`false`). **Must stay unset or `"false"` in production.** |
| `NEXT_PUBLIC_USE_MOCKS` | Optional (Dev / Test only) | `false` | Checked in `components/payment/PaymentForm.tsx`. When `"true"`, simulates XDR generation and payment submission offline. Defaults to live contract flow (`false`) when omitted. **Must stay unset or `"false"` in production.** |
| `ENABLE_VISUAL_TEST_ROUTES` | Optional (Server / E2E only) | Unset (routes return `404` in production) | Checked by `app/dispute-form-test/page.tsx` and `app/badge-visual-test/page.tsx`. In `NODE_ENV === "production"`, those test pages call `notFound()` unless `ENABLE_VISUAL_TEST_ROUTES === "1"`. Set to `"1"` automatically by `playwright.config.ts` `webServer.env`. |

### 7. Build, Runtime & CI/Test Runner

| Variable Name | Required / Optional | Default Value | Purpose |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | Runtime-managed | `"development"` / `"production"` / `"test"` | Standard Node.js / Next.js environment mode (do not hardcode in `.env.local`). Controls CSP `'unsafe-eval'` and `/_next/static` `Cache-Control` headers in `next.config.ts`, PostHog dev opt-out in `lib/analytics.ts`, and visual test route gating in `app/dispute-form-test/page.tsx` and `app/badge-visual-test/page.tsx`. |
| `CI` | Optional (CI runners) | Unset (`false` behavior) | Read by `playwright.config.ts` to enable `forbidOnly`, set `retries` (`2` in CI vs `0` locally), limit `workers` (`1`), and disable `reuseExistingServer`. |
| `STORYBOOK_URL` | Optional (E2E only) | Unset | Base URL for a running Storybook instance read by `tests/e2e/payment-qr.spec.ts`. When omitted, the Storybook share-card QR scanner test is skipped cleanly. |
| `NODE_OPTIONS` | Optional (Runtime / Script) | Unset (`--max-old-space-size=4096` in audit script) | Node.js CLI flags passed internally by `scripts/purge-tailwind-audit.mjs` to increase V8 heap memory while compiling Tailwind CSS for audit checks. |
