# Test Selection & Fixture Architecture Guide

This guide explains how to select, execute, and extend tests across TrustLink's unit, integration, and end-to-end (E2E) testing suites. It details the runtime configurations, module shims, dual-layer fixture architecture, and CI workflow states.

---

## 1. Test Selection & Command Reference

All test commands correspond directly to checked-in scripts in `package.json`:

| Test Category | Command | Target Runner | Description / Usage |
|---|---|---|---|
| **Unit & Component Tests** | `npm test`<br/>*(or `npm run test`)* | Vitest | Executes all unit and component tests once via `vitest run`. Excludes E2E suites. |
| **Targeted Unit Test** | `npx vitest run <path>` | Vitest | Runs a single test file (e.g. `npx vitest run components/providers/SubscriptionProvider.test.tsx`). |
| **Interactive Watch Mode** | `npx vitest <path>` | Vitest | Runs tests in interactive watch mode for fast TDD cycles. |
| **Code Coverage** | `npx vitest run --coverage` | Vitest / v8 | Generates code coverage metrics for unit tests. |
| **Type Checking** | `npm run type-check` | TypeScript (`tsc`) | Validates TypeScript types across the entire project (`tsc --noEmit`). |
| **Linting & Code Style** | `npm run lint` | ESLint | Checks ESLint rules and import sorting. |
| **Component Storybook** | `npm run storybook` | Storybook | Starts Storybook UI workshop on port 6006 (`storybook dev -p 6006`). |
| **Storybook Build** | `npm run build-storybook` | Storybook | Builds static Storybook documentation bundle. |
| **End-to-End Tests** | `npm run test:e2e` | Playwright | Runs Playwright E2E tests against local production web server. Requires pre-build (`npm run build`). |
| **Interactive E2E Debugger** | `npm run test:e2e:ui` | Playwright UI | Opens Playwright interactive trace viewer and test runner. |
| **Targeted E2E Spec** | `npx playwright test <path>` | Playwright | Executes a specific E2E spec (e.g. `npx playwright test tests/e2e/payment-flow.spec.ts`). |

> **Note on Test Runner:** TrustLink uses **Vitest** for unit and component testing, configured via `vitest.config.ts`. References to Jest in earlier docs were legacy artifacts; no Jest runner is installed.

---

## 2. Unit Testing Architecture & Next.js Module Shims (`vitest.config.ts`)

Unit tests execute in Vitest using `jsdom` with `@testing-library/react`. Because Next.js App Router internal runtime features cannot be parsed natively by Vite/jsdom, `vitest.config.ts` configures path aliases pointing to lightweight mock implementations in `__mocks__/`:

### Module Shims

| Import Path | Shim Implementation | Behavior in Tests |
|---|---|---|
| `next/image` | `__mocks__/next-image.tsx` | Renders a standard `<img>` tag with forwarded `src`, `alt`, and `width`/`height` props, omitting Next.js optimizer logic. |
| `next/link` | `__mocks__/next-link.tsx` | Renders a standard `<a>` anchor tag without Next.js route prefetching. |
| `next/navigation` | `__mocks__/next-navigation.ts` | Stubs `useRouter()` (`push`, `replace`, `back`, `prefetch`), `usePathname()`, `useSearchParams()`, `notFound()`, and `redirect()`. |
| `next/server` | `__mocks__/next-server.ts` | Stubs `NextRequest` and `NextResponse` for testing route helpers in jsdom. |
| `next/dynamic` | `__mocks__/next-dynamic.tsx` | Synchronously resolves dynamic imports, bypassing client chunk lazy-loading. |
| `next/og` | `__mocks__/next-og.ts` | Stubs `ImageResponse` for Open Graph route handler testing. |

### Vitest Setup (`vitest.setup.ts`)

The global setup file:
1. Extends Vitest assertions with `@testing-library/jest-dom/vitest`.
2. Polyfills browser APIs not provided by jsdom: `window.matchMedia`, `ResizeObserver`, `IntersectionObserver`, and `requestAnimationFrame`.
3. Sets up cleanup hooks for `localStorage` and resets active timers after each test.

---

## 3. Playwright E2E Architecture & Dual Mocking Layer

Playwright tests run in `tests/e2e/` against the Next.js App Router. Because the App Router combines server-side rendering (SSR) and client-side hydration, network mocking must operate at two distinct layers:

```
                          ┌────────────────────────────────────────────────────────┐
                          │ Playwright Test Runner (tests/e2e/)                    │
                          └────────────────────────────────────────────────────────┘
                                      │                              │
                                      ▼                              ▼
                 ┌─────────────────────────────────┐   ┌─────────────────────────────────┐
                 │ 1. Server Fetch Proxy Mocks     │   │ 2. Browser Routing Mocks        │
                 │ next.onFetch (next/experimental)│   │ page.route("**/api/**")         │
                 └─────────────────────────────────┘   └─────────────────────────────────┘
                                      │                              │
                                      ▼                              ▼
                 ┌─────────────────────────────────┐   ┌─────────────────────────────────┐
                 │ Next.js Node.js Server Runtime  │   │ Headless Chromium Browser       │
                 │ (SSR / generateMetadata / RSC)  │   │ (Client Components / SWR / DOM) │
                 └─────────────────────────────────┘   └─────────────────────────────────┘
```

### Layer 1: Server-Side Fetch Proxy Mocks (`setupNextOnFetch`)
- **Utility**: `setupNextOnFetch(next, options)` in `tests/e2e/helpers/mock-api.ts`.
- **Mechanism**: Utilizes `next.onFetch()` from `next/experimental/testmode/playwright`.
- **Target**: Intercepts HTTP requests executed inside the **Node.js server environment** during SSR, Server Component rendering, and metadata generation (e.g. `getEscrow(escrowId)` in `app/pay/[escrowId]/page.tsx` `generateMetadata`).
- **Why Required**: Browser-level network interception (`page.route`) cannot see or intercept requests originating from the Next.js Node process.

### Layer 2: Browser Routing Mocks (`page.route`)
- **Utility**: Registered inside `setupNetworkMocks(page, next, options)` in `tests/e2e/helpers/mock-api.ts`.
- **Mechanism**: Playwright's `page.route("**/api/**", ...)`.
- **Target**: Intercepts client-side `fetch` calls made by the browser after hydration (e.g., user button clicks, 30s notification polling, contact PATCH updates).

### Layer 3: Wallet Browser Mock (`mockFreighter`)
- **Utility**: `mockFreighter(page, publicKey, signedXdr, options)` in `tests/e2e/helpers/mock-freighter.ts`.
- **Mechanism**: Injects a fake `window.freighter` into `page.addInitScript` before page scripts load.
- **Target**: Stubs `isConnected`, `isAllowed`, `getPublicKey`, and `signTransaction`, allowing automated testing of wallet-gated UI without the physical browser extension.

### Strongly-Typed Fixtures (`tests/e2e/fixtures/`)
- Fixtures (`escrows.json`, `disputes.json`) are cast to domain types via `MockEscrow = Partial<Escrow>` and `MockDispute = Partial<Omit<Dispute, "escrow">> & { escrow?: MockEscrow }`.
- **Benefit**: If a domain field is renamed or an enum value changes in `types/index.ts`, TypeScript compiler catches the drift immediately, preventing test suites from validating obsolete schemas.

---

## 4. Build & Environment Prerequisites for E2E Tests

Running Playwright E2E tests locally requires starting the production server, because `playwright.config.ts` configures:

```typescript
webServer: {
  command: "npm run start -- --hostname 127.0.0.1 --port 3000",
  url: "http://127.0.0.1:3000",
  reuseExistingServer: !process.env.CI,
  timeout: 120000,
}
```

### Prerequisites Checklist Before Running `npm run test:e2e`

1. **Active Node Runtime**: Node.js 22 (run `nvm use` or verify with `node -v`).
2. **Dependencies**: Installed from lockfile (`npm ci`).
3. **Playwright Chromium Browser**: Installed via `npx playwright install chromium` (or `npx playwright install --with-deps chromium`).
4. **Environment Variables**: `NEXT_PUBLIC_CONTRACT_ID` and `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` must be defined (can be mock strings during build):
   ```bash
   # Linux / macOS
   export NEXT_PUBLIC_CONTRACT_ID=CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC
   export NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
   # Windows PowerShell
   $env:NEXT_PUBLIC_CONTRACT_ID="CDLZFC3SYJYDZT7K67VZ75HPJVIEUVNIXF47ZG2FB2RMQQVU2HHGCYSC"
   $env:NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
   ```
5. **Production Build**: Build the app before executing E2E tests:
   ```bash
   npm run build
   npm run test:e2e
   ```

---

## 5. CI Workflow Status

Understanding what runs in GitHub Actions prevents false assumptions about PR validation:

| GitHub Actions Workflow | Trigger | Jobs & Status | Locally Reproducible Command |
|---|---|---|---|
| `.github/workflows/unit-tests.yml` | `push`, `pull_request` (`main`, `develop`) | **Active**: Runs Vitest unit tests | `npm run test` |
| `.github/workflows/type-check.yml` | `push`, `pull_request` (all branches) | **Active**: Runs TypeScript compiler | `npm run type-check` |
| `.github/workflows/lint.yml` | `push`, `pull_request` (`main`, `develop`) | **Active**: Runs ESLint | `npm run lint` |
| `.github/workflows/e2e-tests.yml` | `push`, `pull_request` | **DISABLED** (`if: false` on `playwright` job) | `npm run build && npm run test:e2e` *(Backlog #112)* |
| `.github/workflows/lighthouse.yml` | `push`, `pull_request` (`main`) | **DISABLED** (`if: false` on `lhci` job) | `npm run lighthouse:ci` |

> **Why Playwright is Disabled in CI**:
> As documented in backlog issue #112 ("chore: restore the disabled Playwright workflow with deterministic prerequisites"), the Playwright workflow was temporarily disabled with `if: false` pending optimization of the containerized production build cache and headless browser dependencies. Contributors should run unit tests (`npm test`), lint (`npm run lint`), and type-check (`npm run type-check`) for standard PR validation.
