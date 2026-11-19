# Environment Variables

> **Canonical Reference**: This document is the canonical source of truth for all environment variables used by the TrustLink frontend application. For a quick pointer at the repository root, see [ENV_VARS.md](../ENV_VARS.md).

This guide documents every environment variable used across the codebase, its requirement status, default value, exposure scope (client-safe vs. server-only), evaluation lifecycle (build-time vs. runtime), and its consuming modules.

---

## Table of Contents

- [Validation & Source of Truth](#validation--source-of-truth)
- [Public URL Keys Compared](#public-url-keys-compared)
- [Variable Exposure & Evaluation Lifecycle](#variable-exposure--evaluation-lifecycle)
- [Required Variables](#required-variables)
- [Optional & Defaulted Variables](#optional--defaulted-variables)
  - [Stellar & Soroban RPC](#stellar--soroban-rpc)
  - [Public URLs & SEO](#public-urls--seo)
  - [Error Tracking (Sentry)](#error-tracking-sentry)
  - [Product Analytics (PostHog)](#product-analytics-posthog)
  - [Rate Limiting (Upstash Redis)](#rate-limiting-upstash-redis)
  - [Development & Mocking Flags](#development--mocking-flags)
  - [Test & CI Runner Variables](#test--ci-runner-variables)
- [Legacy & Unused Variables](#legacy--unused-variables)
- [Environment Configurations](#environment-configurations)
- [Security Best Practices](#security-best-practices)
- [Troubleshooting](#troubleshooting)

---

## Validation & Source of Truth

The repository contains two environment validation mechanisms with different scopes:

### 1. `next.config.ts` (Effective Build-Time & Dev Server Gatekeeper)

`next.config.ts` executes automatically during `next build` and `next dev` startup. It acts as the **effective build-time validator** that prevents compilation if any required variable is missing:

```typescript
const REQUIRED_ENV_VARS = [
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_CONTRACT_ID",
  "NEXT_PUBLIC_STELLAR_NETWORK",
  "NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE",
] as const;
```

If any of these 4 keys are missing or empty, `next build` and `next dev` immediately abort with an explanatory error.

### 2. `env-validation.js` (Standalone Runtime Script)

`env-validation.js` is a standalone script that checks a minimal subset of setup variables:

```javascript
const REQUIRED_VARIABLES = [
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_STELLAR_NETWORK"
];
```

This script can be executed independently in Node.js environments (`node env-validation.js`) to verify basic connectivity variables before launching dependent sub-processes.

---

## Public URL Keys Compared

The frontend utilizes distinct URL variables for different architectural layers. Use this comparison to configure the right keys:

| Environment Variable | Target Destination | Consuming Modules | Lifecycle | Example Value |
| :--- | :--- | :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Backend REST API server | `lib/api/client.ts`, `lib/stellar.ts`, `app/pay/[escrowId]/PaymentClient.tsx`, `next.config.ts` | Inlined into client JS & CSP `connect-src` | `http://localhost:3001` or `https://api.trustlink.app` |
| `NEXT_PUBLIC_SITE_URL` | Public canonical website origin | `app/sitemap.ts`, `app/robots.ts`, `app/tracking/page.tsx`, `components/payment/PaymentSection.tsx` | Server runtime (SEO routes) & client (origin check) | `https://trustlink.app` |
| `NEXT_PUBLIC_APP_URL` | Root application base URL | `app/layout.tsx` (`metadataBase`) | Server runtime (metadata generation) | `https://trustlink.app` |
| `NEXT_PUBLIC_SOROBAN_RPC_URL` | Stellar Soroban JSON-RPC node | `lib/stellar/contract.ts`, `components/providers/NetworkProvider.tsx`, `next.config.ts` | Inlined into client JS & CSP `connect-src` | `https://soroban-testnet.stellar.org` |
| `NEXT_PUBLIC_BASE_URL` | *(Legacy / Unused)* | None (formerly mock escrow route) | Deprecated | `http://localhost:3000` |

### Key Differences:
- **`NEXT_PUBLIC_API_URL` vs `NEXT_PUBLIC_SITE_URL`**: `NEXT_PUBLIC_API_URL` points to the backend server handling data, escrow queries, and user authentication. `NEXT_PUBLIC_SITE_URL` points to the hosted web application itself for canonical URLs, sitemaps, and robots directives.
- **`NEXT_PUBLIC_SITE_URL` vs `NEXT_PUBLIC_APP_URL`**: Both typically point to `https://trustlink.app` in production. However, `NEXT_PUBLIC_APP_URL` specifically populates Next.js `metadataBase` in `app/layout.tsx` to resolve relative Open Graph / Twitter image URLs, whereas `NEXT_PUBLIC_SITE_URL` powers canonical links and sitemap generators.

---

## Variable Exposure & Evaluation Lifecycle

### Client-Safe (`NEXT_PUBLIC_` Prefix)
- **Exposure**: Inlined by Next.js at **build time** into client JavaScript bundles.
- **Security**: Publicly readable by anyone inspecting network traffic or JavaScript bundles in browser DevTools. **Never place secrets, private keys, or internal API tokens in `NEXT_PUBLIC_` variables.**
- **Access**: Accessible anywhere in the codebase (`app/`, `components/`, `lib/`, `hooks/`).

### Server-Only (No Prefix)
- **Exposure**: Retained strictly in server-side Node.js memory. Never bundled or leaked to the client browser.
- **Security**: Suitable for secret tokens, database credentials, and internal service keys (e.g. `UPSTASH_REDIS_REST_TOKEN`, `SENTRY_AUTH_TOKEN`).
- **Access**: Accessible only in server components, API route handlers (`app/api/`), server actions, middleware, and build scripts. Accessing them in client components evaluates to `undefined`.

---

## Required Variables

These 4 variables are enforced by `next.config.ts` at build time and are mandatory for running the application:

### `NEXT_PUBLIC_API_URL`
- **Required**: Yes (`next.config.ts`, `env-validation.js`)
- **Exposure**: Public (`NEXT_PUBLIC_`)
- **Lifecycle**: Build-time inline & server runtime
- **Purpose**: Base URL for the TrustLink backend REST API.
- **Default**: None
- **Example**: `http://localhost:3001` (development) or `https://api.trustlink.app` (production)
- **Consuming Modules**:
  - `lib/api/client.ts` (`getBaseUrl()` normalizes trailing slashes)
  - `lib/stellar.ts`
  - `app/pay/[escrowId]/PaymentClient.tsx`
  - `next.config.ts` (whitelisted in CSP `connect-src`)

### `NEXT_PUBLIC_CONTRACT_ID`
- **Required**: Yes (`next.config.ts` `REQUIRED_ENV_VARS`)
- **Exposure**: Public (`NEXT_PUBLIC_`)
- **Lifecycle**: Build-time inline & client runtime
- **Purpose**: Soroban smart contract identifier (56-character string starting with `C`) managing escrow deposits, releases, and disputes.
- **Default**: None (leave empty in local `.env.example` template; required for building and executing contract operations)
- **Example**: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC`
- **Consuming Modules**:
  - `app/pay/[escrowId]/PaymentEscrowClient.tsx` (reads address to trigger funding)
  - `next.config.ts` (validated at startup)

### `NEXT_PUBLIC_STELLAR_NETWORK`
- **Required**: Yes (`next.config.ts`, `env-validation.js`)
- **Exposure**: Public (`NEXT_PUBLIC_`)
- **Lifecycle**: Build-time inline & client/server runtime
- **Purpose**: Target Stellar network environment (`testnet` or `mainnet`).
- **Allowed Values**: `testnet` | `mainnet`
- **Default**: None in validation; falls back to `"testnet"` in `lib/explorer.ts` if unassigned
- **Example**: `testnet`
- **Consuming Modules**:
  - `components/providers/NetworkProvider.tsx` (configures network context for wallet and contract interactions)
  - `lib/explorer.ts` (formats Stellar Expert block explorer links)
  - `next.config.ts` (validated at startup)

### `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE`
- **Required**: Yes (`next.config.ts` `REQUIRED_ENV_VARS`)
- **Exposure**: Public (`NEXT_PUBLIC_`)
- **Lifecycle**: Build-time validation guard
- **Purpose**: Network passphrase string required by Stellar SDK for cryptographically verifying and signing transactions.
- **Default**: None in `next.config.ts` validation
- **Example**:
  - Testnet: `Test SDF Network ; September 2015`
  - Mainnet: `Public Global Stellar Network ; September 2015`
- **Consuming Modules**:
  - `next.config.ts` (validated at build time)
  - *Runtime note*: Runtime wallet helpers in `NetworkProvider.tsx` and `lib/stellar/networks.ts` map network names to standard SDK constants (`Networks.TESTNET` / `Networks.PUBLIC`), while `next.config.ts` validates that this variable is explicitly declared in deployment configurations to safeguard against environment discrepancies.

---

## Optional & Defaulted Variables

### Stellar & Soroban RPC

#### `NEXT_PUBLIC_SOROBAN_RPC_URL`
- **Required**: No
- **Exposure**: Public (`NEXT_PUBLIC_`)
- **Purpose**: Soroban RPC node endpoint for simulating smart contract transactions and retrieving contract state.
- **Default**: `https://soroban-testnet.stellar.org`
- **Example**: `https://soroban-testnet.stellar.org` (testnet) or `https://soroban-mainnet.stellar.org` (mainnet)
- **Consuming Modules**:
  - `lib/stellar/contract.ts` (RPC client connection for contract state queries and transaction submission)
  - `components/providers/NetworkProvider.tsx` (passed to active network context)
  - `next.config.ts` (whitelisted in CSP `connect-src`)

---

### Public URLs & SEO

#### `NEXT_PUBLIC_SITE_URL`
- **Required**: No
- **Exposure**: Public (`NEXT_PUBLIC_`)
- **Purpose**: Canonical frontend site URL used for search engine indexing, sitemaps, robots.txt directives, and payment link origin verification.
- **Default**: `https://trustlink.app`
- **Example**: `http://localhost:3000` (development) or `https://trustlink.app` (production)
- **Consuming Modules**:
  - `app/sitemap.ts` (generates absolute sitemap URLs)
  - `app/robots.ts` (declares sitemap location)
  - `app/tracking/page.tsx` (sets canonical link and Open Graph metadata)
  - `components/payment/PaymentSection.tsx` (validates payment URL origin)

#### `NEXT_PUBLIC_APP_URL`
- **Required**: No
- **Exposure**: Public (`NEXT_PUBLIC_`)
- **Purpose**: Base application URL passed to Next.js `metadataBase` in root layout.
- **Default**: `https://trustlink.app`
- **Example**: `http://localhost:3000` (development) or `https://trustlink.app` (production)
- **Consuming Modules**:
  - `app/layout.tsx` (configures `metadataBase` for resolving relative Open Graph and Twitter asset URLs)

---

### Error Tracking (Sentry)

#### `NEXT_PUBLIC_SENTRY_DSN`
- **Required**: No
- **Exposure**: Public (`NEXT_PUBLIC_`)
- **Purpose**: Sentry Data Source Name for frontend and server-side exception capturing.
- **Default**: None (error tracking is disabled when unset)
- **Example**: `https://examplePublicKey@o0.ingest.sentry.io/0`
- **Consuming Modules**:
  - `sentry.client.config.ts` (browser error capturing)
  - `sentry.server.config.ts` (Node.js runtime error capturing)
  - `sentry.edge.config.ts` (Edge runtime error capturing)

#### `SENTRY_AUTH_TOKEN`
- **Required**: No (only required in CI/CD when source map upload is enabled)
- **Exposure**: Server-only / Build-time
- **Purpose**: Sentry authentication token for uploading source maps during production builds.
- **Default**: None
- **Example**: `sntrys_...`
- **Consuming Modules**:
  - `next.config.ts` (via `@sentry/nextjs` webpack plugin)

---

### Product Analytics (PostHog)

#### `NEXT_PUBLIC_POSTHOG_KEY`
- **Required**: No
- **Exposure**: Public (`NEXT_PUBLIC_`)
- **Purpose**: PostHog project API key for client-side event tracking and feature flags.
- **Default**: None (analytics initialization is skipped if empty)
- **Example**: `phc_...`
- **Consuming Modules**:
  - `lib/analytics.ts` (`initAnalytics()`)

#### `NEXT_PUBLIC_POSTHOG_DISABLED`
- **Required**: No
- **Exposure**: Public (`NEXT_PUBLIC_`)
- **Purpose**: Kill-switch to completely disable PostHog analytics across local development or privacy-sensitive environments.
- **Default**: `false`
- **Example**: `true` | `false`
- **Consuming Modules**:
  - `lib/analytics.ts` (`isAnalyticsDisabled()`)

---

### Rate Limiting (Upstash Redis)

#### `UPSTASH_REDIS_REST_URL`
- **Required**: No (falls back to local in-memory rate limiting when unset)
- **Exposure**: Server-only
- **Purpose**: Upstash Redis REST API URL for distributed serverless rate limiting.
- **Default**: None
- **Example**: `https://example-12345.upstash.io`
- **Consuming Modules**:
  - `lib/rateLimit.ts` (`getUpstashLimiter()`)

#### `UPSTASH_REDIS_REST_TOKEN`
- **Required**: No (required if `UPSTASH_REDIS_REST_URL` is set)
- **Exposure**: Server-only
- **Purpose**: Secret REST token for authenticating against Upstash Redis.
- **Default**: None
- **Example**: `AXXXaaaaBBBbbb...`
- **Consuming Modules**:
  - `lib/rateLimit.ts` (`getUpstashLimiter()`)

#### `RATE_LIMIT_FAIL_CLOSED`
- **Required**: No
- **Exposure**: Server-only
- **Purpose**: Dictates fallback behavior when Upstash Redis is unreachable. When set to `"true"`, requests encountering Redis errors are rejected (fail closed). By default, the rate limiter fails open and falls back to in-memory limiting.
- **Default**: `false` (fail-open)
- **Example**: `true` | `false`
- **Consuming Modules**:
  - `lib/rateLimit.ts` (`enforceRateLimit()`)

---

### Development & Mocking Flags

#### `NEXT_PUBLIC_ESCROW_MOCK_PAYMENTS`
- **Required**: No (development / testing only)
- **Exposure**: Public (`NEXT_PUBLIC_`)
- **Purpose**: When `"true"`, `submitPayment()` returns a deterministic simulated transaction hash instead of submitting transaction XDR to the Stellar network.
- **Default**: `false`
- **Example**: `false` (production) or `true` (local wallet testing)
- **Consuming Modules**:
  - `lib/stellar/contract.ts` (`isMockPaymentsEnabled()`)

#### `NEXT_PUBLIC_USE_MOCKS`
- **Required**: No (development / testing only)
- **Exposure**: Public (`NEXT_PUBLIC_`)
- **Purpose**: When `"true"`, `PaymentForm` mocks transaction XDR generation and signing without contacting contract helpers.
- **Default**: `false`
- **Example**: `false` (production) or `true` (offline UI testing)
- **Consuming Modules**:
  - `components/payment/PaymentForm.tsx`

---

### Test & CI Runner Variables

#### `STORYBOOK_URL`
- **Required**: No (testing only)
- **Exposure**: Test runner only
- **Purpose**: Host URL where Storybook is running during Playwright visual regression tests.
- **Default**: `http://localhost:6006`
- **Example**: `http://localhost:6006`
- **Consuming Modules**:
  - `tests/e2e/payment-qr.spec.ts`

#### `CI`
- **Required**: No (automatically set in CI environments)
- **Exposure**: Test runner only
- **Purpose**: Indicates continuous integration execution (e.g., GitHub Actions) to adjust Playwright test workers, retries, and server reuse.
- **Default**: Unset locally
- **Example**: `true`
- **Consuming Modules**:
  - `playwright.config.ts`

---

## Legacy & Unused Variables

The following keys are retained here for historical context and migration purposes, but have no active consumers in modern application runtime code:

| Variable | Status | Historical Context & Modern Replacement |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_HORIZON_URL` | **Unused / Legacy** | Previously used to query the Stellar Horizon API. Modern contract and account operations interact directly with Soroban RPC via `NEXT_PUBLIC_SOROBAN_RPC_URL`. Unused by frontend runtime. |
| `NEXT_PUBLIC_USDC_CONTRACT` | **Unused / Legacy** | Present in legacy deployment checklists and CI workflows. Token addresses are managed directly on the smart contract layer; unused by frontend code. |
| `NEXT_PUBLIC_BASE_URL` | **Unused / Legacy** | Formerly used in local mock escrow creation route handlers (`/pay/:id`). Modern escrow creation delegates to `createEscrow()` via `NEXT_PUBLIC_API_URL`, and canonical link resolution uses `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_APP_URL`. |

---

## Environment Configurations

### Local Development (`.env.local`)

```env
# Required
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_CONTRACT_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC

# Optional: Soroban RPC
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# Optional: Public URLs
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Development Flags
NEXT_PUBLIC_ESCROW_MOCK_PAYMENTS=false
NEXT_PUBLIC_USE_MOCKS=false
NEXT_PUBLIC_POSTHOG_DISABLED=true
```

### Production Deployment

```env
# Required
NEXT_PUBLIC_API_URL=https://api.trustlink.app
NEXT_PUBLIC_STELLAR_NETWORK=mainnet
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Public Global Stellar Network ; September 2015
NEXT_PUBLIC_CONTRACT_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC

# Optional: Soroban RPC
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-mainnet.stellar.org

# Optional: Public URLs
NEXT_PUBLIC_SITE_URL=https://trustlink.app
NEXT_PUBLIC_APP_URL=https://trustlink.app

# Optional: Monitoring & Analytics
NEXT_PUBLIC_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
SENTRY_AUTH_TOKEN=sntrys_...
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_DISABLED=false

# Optional: Rate Limiting
UPSTASH_REDIS_REST_URL=https://example-12345.upstash.io
UPSTASH_REDIS_REST_TOKEN=AXXXaaaaBBBbbb...
RATE_LIMIT_FAIL_CLOSED=false
```

---

## Security Best Practices

1. **Never commit `.env.local`, `.env.production`, or `.env` files** containing real secrets or production tokens.
2. **Never expose secrets via `NEXT_PUBLIC_`**: Variables prefixed with `NEXT_PUBLIC_` are baked into client-side JS bundles and viewable by any user.
3. **Rotate tokens regularly**: Especially `SENTRY_AUTH_TOKEN` and `UPSTASH_REDIS_REST_TOKEN`.
4. **Isolate staging and production keys**: Avoid using production Sentry DSNs or Redis instances in local development.

---

## Troubleshooting

### "Missing required environment variable: [KEY]"
- Occurs during `next build` or `next dev` when one of the 4 required variables (`NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CONTRACT_ID`, `NEXT_PUBLIC_STELLAR_NETWORK`, `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE`) is omitted.
- **Solution**: Check that `.env.local` exists (`cp .env.example .env.local`), verify that all 4 keys have non-empty values, and restart your server.

### "CRITICAL ERROR: You are missing required setup variables!"
- Occurs when running `node env-validation.js` if `NEXT_PUBLIC_API_URL` or `NEXT_PUBLIC_STELLAR_NETWORK` is missing.
- **Solution**: Ensure your shell environment or `.env` file exports the requested keys.

### Server-only variable evaluates to `undefined`
- Server-only variables (without `NEXT_PUBLIC_`) cannot be accessed inside client components (`"use client"`).
- **Solution**: Move the logic reading the secret to a Next.js Server Component or Route Handler (`app/api/`).
