# Environment Variables

This document describes all environment variables used by the TrustLink frontend application. For each variable you will find whether it is required/optional, a description, an example value, and whether it is server-only or client-safe (`NEXT_PUBLIC_`).

> Cross-reference: `env-validation.js` (runtime check for `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_STELLAR_NETWORK`) and `next.config.ts` (build-time check for `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_CONTRACT_ID`, `NEXT_PUBLIC_STELLAR_NETWORK`, `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE`). See [Validation](#validation) below.

## Required Variables

These variables must be set for the application to start (validated at build and startup):

### `NEXT_PUBLIC_API_URL`

- **Required**: Yes
- **Exposure**: Public — `NEXT_PUBLIC_` (bundled to client)
- **Purpose**: Backend API base URL for all server requests
- **Example**: `http://localhost:3001` (local) or `https://api.trustlink.app` (production)
- **Used in**: API client (`lib/api/client.ts`, `lib/api-client.ts`), escrow operations, payment flows
- **Validation**: Listed in `env-validation.js` `REQUIRED_VARIABLES` and `next.config.ts` `REQUIRED_ENV_VARS`

### `NEXT_PUBLIC_STELLAR_NETWORK`

- **Required**: Yes
- **Exposure**: Public — `NEXT_PUBLIC_`
- **Purpose**: Stellar network identifier
- **Values**: `testnet` | `mainnet`
- **Example**: `testnet`
- **Used in**: Wallet connections (`WalletProvider`), contract calls, Horizon/Soroban helpers (`lib/explorer.ts`, `lib/stellar/`)
- **Validation**: Listed in `env-validation.js` and `next.config.ts`

## Conditionally Required / Recommended

### `NEXT_PUBLIC_CONTRACT_ID`

- **Required**: Yes at build time (`next.config.ts`), optional at runtime for non-escrow pages — but **required for any escrow operation**
- **Exposure**: Public — `NEXT_PUBLIC_`
- **Purpose**: Soroban smart contract address for escrow operations
- **Example**: `CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC` (56-char contract ID, starts with `C`)
- **Used in**: Escrow creation, funding, release operations (`lib/stellar/contract.ts`)
- **Note**: Leave empty only for frontend-only development without contract calls

### `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE`

- **Required**: Yes at build time (`next.config.ts`), has sensible defaults at runtime
- **Exposure**: Public — `NEXT_PUBLIC_`
- **Purpose**: Network passphrase for transaction signing — must match the selected network
- **Example**: `Test SDF Network ; September 2015` (testnet) or `Public Global Stellar Network ; September 2015` (mainnet)
- **Used in**: Transaction signing, network validation

## Optional Variables

### Stellar / Soroban

#### `NEXT_PUBLIC_SOROBAN_RPC_URL`

- **Required**: No
- **Exposure**: Public — `NEXT_PUBLIC_`
- **Purpose**: Soroban RPC endpoint for contract interactions
- **Default**: `https://soroban-testnet.stellar.org`
- **Example**: `https://soroban-testnet.stellar.org` (testnet) or `https://soroban-mainnet.stellar.org` (mainnet)
- **Used in**: Contract queries, transaction submission (`lib/stellar/contract.ts`, `next.config.ts` headers)

#### `NEXT_PUBLIC_HORIZON_URL` *(legacy / optional)*

- **Required**: No
- **Exposure**: Public — `NEXT_PUBLIC_`
- **Purpose**: Stellar Horizon API URL for account/transaction lookups
- **Default**: `https://horizon-testnet.stellar.org`
- **Example**: `https://horizon-testnet.stellar.org` or `https://horizon.stellar.org`
- **Used in**: `lib/stellar/horizon.ts` if present; falls back to network default when unset
- **Note**: Not listed in `.env.example` but referenced in `README.md` and CI workflow — documented here for completeness

#### `NEXT_PUBLIC_USDC_CONTRACT` *(legacy / optional)*

- **Required**: No
- **Exposure**: Public — `NEXT_PUBLIC_`
- **Purpose**: USDC token contract address on the selected Stellar network
- **Example**: `CAQCFVLOBK5...` (Stellar asset contract ID)
- **Used in**: Display/token references; when unset the app uses the contract-configured USDC
- **Note**: Referenced in `README.md` and `DEPLOYMENT.md` checklist — keep if you need explicit USDC address

### SEO & Metadata

#### `NEXT_PUBLIC_SITE_URL`

- **Required**: No
- **Exposure**: Public — `NEXT_PUBLIC_`
- **Purpose**: Public site URL used in `sitemap.xml` and `robots.txt`
- **Example**: `https://trustlink.app`
- **Used in**: SEO metadata, sitemaps, canonical URLs

#### `NEXT_PUBLIC_APP_URL`

- **Required**: No
- **Exposure**: Public — `NEXT_PUBLIC_`
- **Purpose**: Application URL used in page metadata and social sharing (Open Graph / Twitter cards)
- **Example**: `https://trustlink.app` (production) or `http://localhost:3000` (local)
- **Used in**: `app/layout.tsx` `metadataBase`, `app/api/og/`, page metadata

### Error Tracking (Sentry)

#### `NEXT_PUBLIC_SENTRY_DSN`

- **Required**: No (recommended for production)
- **Exposure**: Public — `NEXT_PUBLIC_` (safe to expose; DSN is not a secret)
- **Purpose**: Sentry Data Source Name for error tracking
- **Example**: `https://examplePublicKey@o0.ingest.sentry.io/0`
- **Used in**: Client (`sentry.client.config.ts`), server (`sentry.server.config.ts`), and edge (`sentry.edge.config.ts`) error reporting

#### `SENTRY_AUTH_TOKEN`

- **Required**: No (only needed for builds with source map uploads)
- **Exposure**: Server-only — **no** `NEXT_PUBLIC_` prefix (never sent to browser)
- **Purpose**: Sentry authentication token for uploading source maps during build
- **Example**: `sntrys_...`
- **Used in**: Build-time source map uploads (`next.config.ts` via `@sentry/nextjs`)
- **Security**: Keep private, never commit to repository

### Analytics (PostHog)

#### `NEXT_PUBLIC_POSTHOG_KEY`

- **Required**: No
- **Exposure**: Public — `NEXT_PUBLIC_`
- **Purpose**: PostHog project API key for product analytics
- **Example**: `phc_...`
- **Used in**: User behavior tracking, feature analytics (`lib/analytics.ts`, `components/providers/`)

#### `NEXT_PUBLIC_POSTHOG_DISABLED`

- **Required**: No (defaults to `false`)
- **Exposure**: Public — `NEXT_PUBLIC_`
- **Purpose**: Flag to completely disable PostHog analytics
- **Example**: `true` or `false`
- **Used in**: Disabling analytics in development or for privacy compliance

### Rate Limiting (Upstash Redis)

#### `UPSTASH_REDIS_REST_URL`

- **Required**: No (falls back to in-memory rate limiting)
- **Exposure**: Server-only — **no** `NEXT_PUBLIC_` prefix
- **Purpose**: Upstash Redis REST URL for distributed rate limiting
- **Example**: `https://example-12345.upstash.io`
- **Used in**: API route rate limiting (`lib/rateLimit.ts`)
- **Note**: When unset, uses in-memory fallback (suitable for development / single instance)

#### `UPSTASH_REDIS_REST_TOKEN`

- **Required**: No (only needed if `UPSTASH_REDIS_REST_URL` is set)
- **Exposure**: Server-only — **no** `NEXT_PUBLIC_` prefix
- **Purpose**: Upstash Redis authentication token
- **Example**: `AXXXaaaaBBBbbb...`
- **Used in**: API route rate limiting authentication (`lib/rateLimit.ts`)
- **Security**: Keep private, never commit to repository

## Variable Exposure Rules

### Frontend-Exposed Variables (`NEXT_PUBLIC_` prefix)

Variables with the `NEXT_PUBLIC_` prefix are:

- **Bundled into the client-side JavaScript** — visible in browser DevTools and network requests
- **Safe to use in client components and hooks** (e.g., `useWallet`, `useEscrow`)
- **Should NOT contain secrets or private keys**
- Examples: API URLs, network identifiers, public contract IDs, feature flags

### Server-Only Variables (no prefix)

Variables without the `NEXT_PUBLIC_` prefix are:

- **Only available in server-side code** (API routes, server components, middleware, build scripts)
- **Never sent to the browser** — safe for secrets and tokens
- **Cannot be accessed in client components** — will be `undefined` if imported there
- Examples: `SENTRY_AUTH_TOKEN`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`

## Environment-Specific Configuration

### Development (`.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Test SDF Network ; September 2015
NEXT_PUBLIC_CONTRACT_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_POSTHOG_DISABLED=true
```

### Production

```env
NEXT_PUBLIC_API_URL=https://api.trustlink.app
NEXT_PUBLIC_STELLAR_NETWORK=mainnet
NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE=Public Global Stellar Network ; September 2015
NEXT_PUBLIC_CONTRACT_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
NEXT_PUBLIC_SITE_URL=https://trustlink.app
NEXT_PUBLIC_APP_URL=https://trustlink.app
NEXT_PUBLIC_SENTRY_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
SENTRY_AUTH_TOKEN=sntrys_...
NEXT_PUBLIC_POSTHOG_KEY=phc_...
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=AXXXaaaa...
```

## Validation

- **`env-validation.js`** — runtime check on startup. Edit `REQUIRED_VARIABLES` array to add/remove required keys:

  ```js
  const REQUIRED_VARIABLES = [
    'NEXT_PUBLIC_API_URL',
    'NEXT_PUBLIC_STELLAR_NETWORK'
  ];
  ```

  Throws `Missing environment configuration: ...` if any are absent.

- **`next.config.ts`** — build-time check (fails `next build` early):

  ```ts
  const REQUIRED_ENV_VARS = [
    "NEXT_PUBLIC_API_URL",
    "NEXT_PUBLIC_CONTRACT_ID",
    "NEXT_PUBLIC_STELLAR_NETWORK",
    "NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE",
  ] as const;
  ```

  Keep both files in sync when adding new required variables. This document reflects both.

## Security Best Practices

1. **Never commit `.env.local` or `.env.production` files** — these contain secrets
2. **Use `.env.example` as a template** — safe to commit, no real values
3. **Rotate tokens regularly** — especially `SENTRY_AUTH_TOKEN` and Upstash tokens
4. **Use separate credentials per environment** — don't reuse production tokens in staging
5. **Audit `NEXT_PUBLIC_` variables** — ensure they don't expose sensitive data
6. **Use environment-specific API endpoints** — never point development to production APIs

## Troubleshooting

### "Missing environment configuration" error

- Check that all variables in `REQUIRED_VARIABLES` (see `env-validation.js`) and `REQUIRED_ENV_VARS` (see `next.config.ts`) are set
- Ensure `.env.local` exists (`cp .env.example .env.local`) and contains the required variables
- Restart the development server after adding new variables (`npm run dev`)

### Variables not updating

- Restart the Next.js dev server — env vars are loaded at startup via `@next/env`
- Check for typos in variable names
- Verify `NEXT_PUBLIC_` prefix for client-side variables

### "undefined" in client components

- Server-only variables (no `NEXT_PUBLIC_` prefix) cannot be accessed in client components
- Add `NEXT_PUBLIC_` prefix if the variable needs to be available client-side
- Consider using an API route to securely access server-only data

---

*Source of truth for variable names: `.env.example`. This document is linked from `README.md` and `DEPLOYMENT.md`.*
