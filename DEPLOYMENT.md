# Deployment and Smoke Test Guide

Use this guide and checklist before and after every production or preview deployment to verify configuration, security headers, observability settings, and application health.

---

## Deployed Security & Network Configuration

### Content Security Policy (CSP) & Allowed Origins

The deployment enforces an explicit Content Security Policy (configured in `next.config.ts`) and security headers on all non-static routes. When validating connectivity and assets, ensure all network requests target approved endpoints:

* **`connect-src` (APIs & RPCs)**:
  * `'self'`
  * `NEXT_PUBLIC_SOROBAN_RPC_URL` (defaults to `https://soroban-testnet.stellar.org`)
  * `NEXT_PUBLIC_API_URL` (configured backend endpoint)
  * Stellar Horizon: `https://horizon.stellar.org`, `https://horizon-testnet.stellar.org`
  * Sentry Ingestion: `https://*.sentry.io`, `https://*.ingest.sentry.io`
  * PostHog Analytics: `https://us.i.posthog.com`
* **`img-src` (Allowed Image Hosts)**:
  * `'self'`, `data:`, `blob:`
  * Stellar Expert: `https://stellarexpert.io`, `https://testnet.stellarexpert.io`
  * Amazon S3: `https://*.s3.amazonaws.com`, `https://*.s3.*.amazonaws.com`
  * Unsplash: `https://images.unsplash.com`
  * Cloudinary: `https://*.cloudinary.com`
  * Imgix: `https://*.imgix.net`
* **`script-src` & `style-src`**:
  * `'self'` and `'unsafe-inline'` (required for Next.js RSC and theme initialization; `'unsafe-eval'` is permitted in development only)
* **Frame Ancestors & Framing Defense**:
  * `frame-ancestors 'self'` in CSP alongside `X-Frame-Options: SAMEORIGIN` header to prevent UI redress and clickjacking.
* **Preconnect Headers**:
  * The `Link` response header preconnects to both `NEXT_PUBLIC_SOROBAN_RPC_URL` and `NEXT_PUBLIC_API_URL`.

---

## Observability & Error Tracking

The application uses Sentry (`@sentry/nextjs`) and PostHog for telemetry. The deployed behavior is configured as follows:

* **Source Maps**:
  * Source map upload is **disabled** (`withSentryConfig` specifies `sourcemaps: { disable: true }` in `next.config.ts`).
  * Production client builds omit public source maps to avoid exposing source details.
* **Trace Sampling**:
  * Configurable via `SENTRY_TRACES_SAMPLE_RATE` / `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE` (bounded between `0.0` and `1.0`).
  * Defaults to `0.1` (10% sampling) when absent or invalid across client, server, and edge environments.
* **Session Replay (Client)**:
  * `replaysSessionSampleRate: 0.1` (10% of standard sessions recorded).
  * `replaysOnErrorSampleRate: 1.0` (100% of sessions with unhandled errors recorded).
* **Error Filtering**:
  * `beforeSend` in `sentry.client.config.ts` drops user-rejected wallet operations (e.g., `"User rejected"` Freighter signature prompts) so expected user cancellations are not logged as errors.
* **Analytics**:
  * PostHog client telemetry sends events directly to `https://us.i.posthog.com` if `NEXT_PUBLIC_POSTHOG_KEY` is set.

---

## CI Pipeline Status & Manual Verification Commands

### Automated CI Status

* **Active CI Jobs** (run on GitHub Actions):
  * **ESLint** (`.github/workflows/lint.yml`): `npm run lint`
  * **TypeScript** (`.github/workflows/type-check.yml`): `npm run type-check`
  * **Unit Tests** (`.github/workflows/unit-tests.yml`): `npm run test`
* **Disabled CI Jobs** (do **NOT** run automatically in CI, gated by `if: false`):
  * **Lighthouse CI** (`.github/workflows/lighthouse.yml`)
  * **Playwright E2E Tests** (`.github/workflows/e2e-tests.yml`)

### Manual Verification Commands

Because automated Lighthouse and Playwright runs are disabled in CI, run these audits manually when verifying releases:

* **Lighthouse Performance & SEO Audit**:
  ```bash
  # Build application with production or test environment variables
  npm run build
  # Run Lighthouse CI autorun locally (uses .lighthouserc.json)
  npm run lighthouse:ci
  ```
* **Playwright End-to-End Tests**:
  ```bash
  # Install browser binaries if needed
  npx playwright install --with-deps chromium
  # Build application
  npm run build
  # Run end-to-end tests against local production build
  npm run test:e2e
  # Or run in interactive UI mode
  npm run test:e2e:ui
  ```

---

## Deployment Smoke Test Checklist

Use this checklist after every production or preview deployment before marking it stable.

### 1. Deployment Health

- [ ] Confirm the deployment completed without build, lint, or type errors.
- [ ] Open the deployed URL in a clean browser session.
- [ ] Verify the home page loads without console errors.
- [ ] Confirm the app uses the expected release branch and commit SHA.
- [ ] Check `/robots.txt`, `/sitemap.xml`, and `/manifest.webmanifest` return successful responses.
- [ ] Confirm the fallback error page and `/offline` page render if their routes are opened directly, and verify service worker precaching and update behavior (see [docs/SERVICE_WORKER.md](docs/SERVICE_WORKER.md)).

### 2. Security Headers & Environment Configuration

- [ ] Confirm `NEXT_PUBLIC_API_URL` points to the intended backend environment.
- [ ] Confirm `NEXT_PUBLIC_STELLAR_NETWORK` is set to the intended network (`testnet` or `mainnet`).
- [ ] Confirm `NEXT_PUBLIC_CONTRACT_ID` and `NEXT_PUBLIC_USDC_CONTRACT` are present.
- [ ] Confirm Horizon (`https://horizon[-testnet].stellar.org`) and Soroban RPC (`https://soroban[-testnet].stellar.org`) are reachable and permitted by CSP `connect-src`.
- [ ] Verify security headers (`Content-Security-Policy`, `X-Frame-Options: SAMEORIGIN`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`) are present on page responses.
- [ ] Verify analytics (`NEXT_PUBLIC_POSTHOG_KEY`) and error-reporting (`NEXT_PUBLIC_SENTRY_DSN`) keys are configured only for the intended environment.
- [ ] Confirm no local development secrets or test-only endpoints are exposed in the client bundle.

### 3. Core Page Checks

- [ ] Visit `/create` and confirm the vendor escrow creation page renders.
- [ ] Visit `/dashboard` and confirm the vendor dashboard handles loading, empty, and populated states.
- [ ] Visit `/pay/test-escrow-id` or a known test escrow link and confirm the buyer payment page renders.
- [ ] Visit `/track/test-escrow-id` or a known test tracking link and confirm the tracking page renders.
- [ ] Visit `/dispute/test-escrow-id` or a known test dispute link and confirm the dispute form renders.
- [ ] Visit `/admin/disputes` with an authorized account and confirm dispute data loads.
- [ ] Verify page metadata appears correctly for core public pages when shared or inspected.

### 4. Wallet And Payment Flow

- [ ] Open the app with Freighter unavailable and confirm wallet UI fails gracefully.
- [ ] Connect Freighter on the intended Stellar network.
- [ ] Confirm the connected public key displays where expected.
- [ ] Start escrow creation and verify required form validation messages appear.
- [ ] Create a test escrow link and confirm the generated URL can be copied.
- [ ] Open the generated buyer payment link in a new session.
- [ ] Confirm the buyer sees the exact token amount and fee breakdown before signing.
- [ ] Trigger a test signature prompt and verify the transaction summary is understandable.
- [ ] Confirm transaction submission shows a clear pending, success, or failure state.

### 5. Tracking And Disputes

- [ ] Confirm shipment status polling works for a known test escrow.
- [ ] Verify every tracking status has both text and a visible status indicator.
- [ ] Mark a vendor shipment as shipped in a test flow and confirm the tracking page updates.
- [ ] Submit a dispute with valid required fields.
- [ ] Confirm invalid dispute evidence or missing fields produce clear validation messages.
- [ ] Confirm the admin dispute detail page shows the submitted evidence.
- [ ] Resolve a test dispute and verify the user-facing status changes.

### 6. Notifications

- [ ] Trigger a test escrow creation event and confirm notification requests are sent.
- [ ] Trigger a shipment update and confirm notification requests are sent.
- [ ] Trigger a dispute submission and confirm notification requests are sent.
- [ ] Confirm notification failures do not block the primary user action.
- [ ] Verify user-facing notification toasts are readable on mobile and desktop.

### 7. Mobile And Accessibility

- [ ] Test the home, create, pay, track, dispute, and dashboard pages at 375px width.
- [ ] Confirm text, buttons, cards, and modals do not overflow or overlap.
- [ ] Navigate key flows with keyboard only.
- [ ] Confirm focus indicators are visible on interactive elements.
- [ ] Confirm form fields have labels or accessible names.
- [ ] Confirm status is communicated with text, not color alone.
- [ ] Verify light and dark themes remain readable.

### 8. Observability & Telemetry Verification

- [ ] Confirm Sentry receives a test event from the deployed environment.
- [ ] Note that source maps are not uploaded to Sentry (`sourcemaps: { disable: true }`), and traces are sampled at 100%.
- [ ] Verify user-rejected transactions (`beforeSend`) do not create false-positive error alerts in Sentry.
- [ ] Confirm analytics events fire only after user interactions that should be tracked (PostHog to `https://us.i.posthog.com`).
- [ ] Review browser console output for CSP violations, CORS failures, or noisy warnings.
- [ ] Review network requests for unexpected 4xx or 5xx responses.
- [ ] Confirm rate-limited endpoints return clear user-facing errors.
- [ ] Check deployment logs for startup, route, and API errors.

### 9. Rollback Readiness

- [ ] Confirm the previous stable deployment is still available for rollback.
- [ ] Confirm release notes or deployment notes include the changed commit SHA.
- [ ] Confirm database, contract, or backend changes are backward compatible with this frontend.
- [ ] Confirm maintainers know who is on call for the first hour after release.
- [ ] Record unresolved issues, skipped checks, and follow-up owners before marking stable.

### Sign-Off

- [ ] Smoke test completed by:
- [ ] Deployment URL:
- [ ] Commit SHA:
- [ ] Date and time:
- [ ] Notes:
