# Architecture Overview

This document describes the frontend architecture for TrustLink, documenting actual modules, provider mounting structure, data access paths, and legacy boundaries alongside planned consolidations.

---

## Component & Module Tree

The following diagram reflects the concrete files and modules present in the repository, distinguishing current parallel access paths from planned consolidations.

```mermaid
flowchart TD
    %% ── App Router (app/) ──
    subgraph APP["app/ (App Router)"]
        A_LAYOUT["layout.tsx<br/>Root Layout & Provider Hierarchy"]
        A_PAGE["page.tsx<br/>Landing Page"]
        A_DASH["dashboard/page.tsx<br/>Vendor Dashboard"]
        A_PAY["pay/[escrowId]/page.tsx<br/>Buyer Payment (Server Component)"]
        A_TRACK["track/[escrowId]/page.tsx<br/>Order Tracking"]
        A_ADMIN["admin/disputes/page.tsx<br/>Admin Dispute Resolution"]
        A_ONBOARD["onboarding/page.tsx<br/>Vendor Onboarding"]
        A_NOTIF["notifications/page.tsx<br/>Notifications View"]
        A_CREATE["create/page.tsx<br/>Escrow Creation"]
        A_OG["api/og/route.tsx<br/>OG Image Generation"]
        A_ESC_ROUTE["escrow/route.ts<br/>Local API Proxy (GET, POST)"]
        A_SHIP_ROUTE["escrow/[id]/ship/route.ts<br/>Local Mock Ship Handler"]
    end

    %% ── Provider Hierarchy (mounted in layout.tsx) ──
    subgraph PROV["components/providers/ (Provider Hierarchy)"]
        P_THEME["ThemeProvider<br/>next-themes dark/light"]
        P_NET["NetworkProvider<br/>Mainnet/Testnet context"]
        P_SW["ServiceWorkerProvider<br/>Offline PWA support"]
        P_WALLET["WalletProvider<br/>Freighter + SEP-10 Auth Context"]
        P_SUB["SubscriptionProvider<br/>FREE/PRO plan + 5m cache"]
        P_CURR["CurrencyProvider<br/>Currency selection & formatting"]
        P_I18N["I18nProvider<br/>react-i18next context"]
        P_NOTIF["NotificationProvider<br/>Polling (30s) + read state"]
    end

    %% ── UI & Domain Components ──
    subgraph COMP["components/"]
        C_ESCROW["components/escrow/<br/>EscrowCreateForm, EscrowLinkCard, DisputeForm"]
        C_TRACK["components/tracking/<br/>TrackingTimeline, TrackingSection, TrackingLookupForm"]
        C_DASH["components/dashboard/<br/>VendorDashboardList, EscrowTableRow, VendorAnalyticsSection, ShipTrackingModal"]
        C_PAY["components/payment/<br/>PaymentSection, PaymentForm, TrustBadge, EscrowCountdown"]
        C_NOTIF["components/notifications/<br/>NotificationBell, NotificationsPageContent"]
        C_ONBOARD["components/onboarding/<br/>VendorOnboardingWizard (3-step)"]
        C_SUB["components/subscription/<br/>ProGate, UpgradeCTA"]
        C_WALLET["components/wallet/<br/>WalletConnectButton"]
        C_LAYOUT["components/layout/<br/>Navbar, Footer, BottomNav, TestnetBanner, OfflineBanner"]
        C_UI["components/ui/<br/>shadcn/ui primitives, CommandPalette, Toaster"]
    end

    %% ── Hooks ──
    subgraph HOOKS["hooks/ & Provider Hooks"]
        HK_WALLET["hooks/useWallet.ts<br/>Context consumer for WalletProvider"]
        HK_ESCROW["hooks/useEscrow.ts<br/>Vendor escrows and creation"]
        HK_TRACK["hooks/useTracking.ts<br/>Escrow tracking details"]
        HK_NET["hooks/useNetwork.ts<br/>Re-export from NetworkProvider"]
        HK_TOAST["hooks/useToast.ts<br/>Toast feedback"]
        HK_NOTIF["useNotifications<br/>Exported from NotificationProvider.tsx"]
        HK_SUB["useSubscription<br/>Exported from SubscriptionProvider.tsx"]
        HK_CURR["useCurrency<br/>Exported from CurrencyProvider.tsx"]
        HK_LEGACY_WALLET["hooks/useStellarWallet.ts<br/>(Legacy / Parallel Wallet Hook)"]
    end

    %% ── Data & Utility Layer ──
    subgraph LIB["lib/ & utils/"]
        L_CANONICAL["lib/api/client.ts<br/>Canonical API Client (request helper)"]
        L_BARREL["lib/api.ts<br/>API Barrel re-exports"]
        L_AUTH_STELLAR["lib/stellar.ts<br/>Direct fetch: /auth/challenge & verify"]
        L_CONTRACT["lib/stellar/contract.ts<br/>Soroban contract invocations"]
        L_FREIGHTER["lib/stellar/freighter.ts<br/>Freighter browser API wrapper"]
        L_NETWORKS["lib/stellar/networks.ts<br/>Passphrase and RPC config"]
        L_NOTIF["lib/notifications.ts<br/>deriveNotifications, localStorage read IDs"]
        L_STORE["lib/escrowStore.ts<br/>In-memory mock store (for local mock route)"]
        L_SESSION["lib/session.ts<br/>SESSION_KEY, refresh schedules, expiry events"]
        L_RATELIMIT["lib/rateLimit.ts<br/>Upstash Redis & in-memory limiter"]
        L_EXPLORER["lib/explorer.ts<br/>Stellar Expert link generator"]
        U_CURRENCY["utils/currency.ts<br/>formatUSDC, formatCurrency"]
    end

    %% ── Types Layer ──
    subgraph TYPES["types/"]
        T_INDEX["types/index.ts<br/>Domain types: Escrow, Dispute, SubscriptionTier"]
        T_API["types/api.ts<br/>API Request/Response interfaces"]
        T_STELLAR["types/stellar.ts<br/>Network and Stellar account types"]
        T_GUARDS["types/guards.ts<br/>Runtime response shape guards"]
        T_STATUS["types/status.ts<br/>Escrow & Dispute status constants"]
    end

    %% ── Mounting & Tree Connections ──
    A_LAYOUT --> P_THEME
    P_THEME --> P_NET
    P_NET --> P_SW
    P_NET --> P_WALLET
    P_WALLET --> P_SUB
    P_SUB --> P_CURR
    P_CURR --> P_I18N
    P_I18N --> P_NOTIF
    P_NOTIF --> C_LAYOUT
    P_THEME --> C_UI

    %% ── Page rendering components ──
    A_DASH --> C_DASH
    A_PAY --> C_PAY
    A_TRACK --> C_TRACK
    A_ADMIN --> C_ESCROW
    A_ONBOARD --> C_ONBOARD
    A_NOTIF --> C_NOTIF
    A_CREATE --> C_ESCROW
    A_CREATE --> C_WALLET

    %% ── Hook to Provider relationships ──
    HK_WALLET --> P_WALLET
    HK_SUB --> P_SUB
    HK_NOTIF --> P_NOTIF
    HK_CURR --> P_CURR
    HK_NET --> P_NET

    %% ── Component to Hook connections ──
    C_DASH --> HK_ESCROW
    C_DASH --> HK_WALLET
    C_PAY --> HK_WALLET
    C_PAY --> U_CURRENCY
    C_NOTIF --> HK_NOTIF
    C_SUB --> HK_SUB
    C_ESCROW --> HK_ESCROW

    %% ── Data Access Connections ──
    HK_ESCROW --> L_BARREL
    HK_TRACK --> L_BARREL
    P_NOTIF -.->|polls 30s| L_BARREL
    P_NOTIF -.->|derives| L_NOTIF
    P_SUB -.->|caches 5m| L_BARREL
    L_BARREL --> L_CANONICAL
    L_CANONICAL --> L_SESSION
    L_CANONICAL --> T_API
    L_CANONICAL --> T_GUARDS

    %% ── Stellar & Wallet wiring ──
    P_WALLET --> L_AUTH_STELLAR
    P_WALLET --> L_FREIGHTER
    P_WALLET --> L_SESSION
    C_PAY --> L_CONTRACT
    L_CONTRACT --> L_NETWORKS

    %% ── Legacy & Parallel Boundaries (Dotted) ──
    HK_LEGACY_WALLET -.->|uncoordinated parallel lifecycle| L_AUTH_STELLAR
    A_SHIP_ROUTE -.->|in-memory local store| L_STORE
    A_ESC_ROUTE -.->|server proxy| L_BARREL
```

---

## Provider Mounting Hierarchy (`app/layout.tsx`)

Providers wrap the application in a specific nested order to ensure dependencies (e.g. network selection required by wallet, and wallet authentication required by subscription and notifications) are initialized in sequence:

```
ThemeProvider
  └── NetworkProvider
        ├── ServiceWorkerProvider (sibling, registered for PWA / offline support)
        ├── OfflineBanner (sibling)
        ├── TestnetBanner (sibling)
        └── WalletProvider
              └── SubscriptionProvider
                    └── CurrencyProvider
                          └── I18nProvider
                                └── NotificationProvider
                                      ├── Navbar
                                      ├── <main>{children}</main>
                                      ├── Footer
                                      ├── BottomNav
                                      └── Toaster (Sonner)
  └── CommandPalette (mounted under ThemeProvider, outside NetworkProvider)
```

### Provider Access Patterns & Real Exports

Provider contexts are consumed via dedicated hooks. In several cases, the hook is exported directly from the provider file rather than a standalone file in `hooks/`:

| Provider | Exporting Module | Hook Import | Owns |
|---|---|---|---|
| `WalletProvider` | `components/providers/WalletProvider.tsx` | `useWallet` from `@/hooks/useWallet` | Freighter extension connection, SEP-10 challenge-response auth, JWT persistence, session expiry listener (`SESSION_EXPIRED_EVENT`), `signTransaction` |
| `NotificationProvider` | `components/providers/NotificationProvider.tsx` | `useNotifications` from `@/components/providers/NotificationProvider` | 30s background polling of `getVendorEscrows`, deriving notifications (`lib/notifications.ts`), `readIds` persistence in `localStorage`, unread counts |
| `SubscriptionProvider` | `components/providers/SubscriptionProvider.tsx` | `useSubscription` from `@/components/providers/SubscriptionProvider` | Subscription details (`getSubscription()`), 5-min caching in `localStorage` (`subscription.cache`), active tier (`FREE`/`PRO`), `isPro` flag |
| `CurrencyProvider` | `components/providers/CurrencyProvider.tsx` | `useCurrency` from `@/components/providers/CurrencyProvider` | Selected display currency, FX rates, and `formatAmount` formatting helper |
| `NetworkProvider` | `components/providers/NetworkProvider.tsx` | `useNetwork` from `@/components/providers/NetworkProvider` (or `@/hooks/useNetwork`) | Active Stellar network selection (`testnet` vs `mainnet`) and passphrases |
| `ThemeProvider` | `components/providers/ThemeProvider.tsx` | `useTheme` from `next-themes` | Dark / light mode toggle with hydration-safe inline script |

---

## Actual Module Locations vs Legacy Documentation

Earlier revisions of architecture documentation listed files that do not exist or placed utilities in incorrect folders. The table below clarifies actual locations:

| Documented Inaccurately | Actual Repository Location | Notes |
|---|---|---|
| `lib/stellar/horizon.ts` | **Does not exist** | Horizon RPC calls are handled directly via `@stellar/stellar-sdk` or configured RPC URLs in `lib/stellar/networks.ts`. Stellar Expert explorer links are generated by `lib/explorer.ts`. |
| `types/escrow.ts` | `types/index.ts` | Domain models (`Escrow`, `Dispute`, `SubscriptionTier`, `AppNotification`) are consolidated in `types/index.ts`. |
| `types/notifications.ts` | `types/index.ts` | `AppNotification` and `NotificationFilter` reside in `types/index.ts`. Notification API preferences reside in `types/api.ts`. |
| `types/subscription.ts` | `types/index.ts` & `types/api.ts` | Tier types reside in `types/index.ts`; API request/response types reside in `types/api.ts`. |
| `lib/utils/currency.ts` | `utils/currency.ts` | `formatUSDC` and currency utility functions reside in the root `utils/` directory, imported as `@/utils/currency`. |
| `components/escrow/TrackingTimeline.tsx` | `components/tracking/TrackingTimeline.tsx` | Tracking components (`TrackingTimeline`, `TrackingSection`, `TrackingLookupForm`) are grouped in `components/tracking/`. |
| `hooks/useNotifications.ts` | `components/providers/NotificationProvider.tsx` | `useNotifications` is exported directly alongside the provider. |
| `hooks/useSubscription.ts` | `components/providers/SubscriptionProvider.tsx` | `useSubscription` is exported directly alongside the provider. |
| `hooks/useCurrency.ts` | `components/providers/CurrencyProvider.tsx` | `useCurrency` is exported directly alongside the provider. |

---

## Data Access Paths: Current Behavior vs Desired Consolidation

TrustLink currently contains parallel data-access paths and legacy boundaries that are being consolidated in upcoming releases.

### 1. Wallet Lifecycle Architecture

```
Current Reality (Parallel implementations):
  [Components] ──> useWallet() ─────────> WalletProvider ──> Freighter / SEP-10 Auth (Session Sync)
  [Legacy Path] ─> useStellarWallet() ──> Local State ────> Freighter / SEP-10 Auth (No Context Sync)

Desired Consolidation (Backlog Issues #101, #102):
  [All Components] ──> useWallet() ──> WalletProvider ──> Centralized Session & Refresh
```

- **Current Behavior**:
  - `WalletProvider` (`components/providers/WalletProvider.tsx`) is the supported context provider. It stores the JWT in `localStorage` (`wallet.jwt` via `SESSION_KEY`), manages session refresh timers (`lib/session.ts`), listens for `SESSION_EXPIRED_EVENT`, and sets the logger user identity.
  - `useStellarWallet` (`hooks/useStellarWallet.ts`) is an uncoordinated parallel hook that implements its own independent state (`publicKey`, `token`) and writes to `wallet.token` instead of `wallet.jwt`. It does not share state across components or handle global expiry events.
- **Consolidation Target**: Unify all wallet consumers behind `WalletProvider` and `useWallet`, removing `useStellarWallet`.

### 2. HTTP Transport & API Client

```
Current Reality (Mixed transport layers):
  [Hooks / Components] ──> lib/api.ts (barrel) ──> lib/api/client.ts (Canonical Client)
  [Auth Helpers] ────────> lib/stellar.ts ─────────> Direct fetch() (/auth/challenge, /auth/verify)
  [Client Fetches] ──────> TrackingSection/Pricing ─> Direct fetch()
  [Local Next.js Routes] ─> app/escrow/route.ts ────> Proxies to lib/api
  [Local Mock Route] ────> app/escrow/[id]/ship ───> lib/escrowStore.ts (In-memory mock)

Desired Consolidation (Backlog Issue #106):
  [All Network Calls] ───> lib/api/client.ts ──────> Single HTTP Transport & Error Layer
```

- **Current Behavior**:
  - `lib/api/client.ts` is the canonical typed client. It implements the centralized `request<T>()` helper, attaches `Authorization: Bearer <token>`, catches network rejections via `ApiNetworkError`, parses structured error payloads with `ApiError`, triggers `handleSessionExpired()` on 401s, and validates responses against runtime type guards (`types/guards.ts`).
  - `lib/api.ts` is a barrel file re-exporting client functions and types for backwards compatibility.
  - `lib/stellar.ts` handles SEP-10 authentication (`getChallenge`, `verifyChallenge`) by calling `fetch` directly with custom error parsing rather than using `lib/api/client.ts`.
  - Certain client components (e.g. `components/tracking/TrackingSection.tsx`, `app/pricing/PricingClient.tsx`) issue direct `fetch` calls.
  - Next.js Route Handlers:
    - `app/escrow/route.ts`: Server-side proxy with rate limiting (`lib/rateLimit.ts`) and Zod validation, delegating to `lib/api`.
    - `app/escrow/[id]/ship/route.ts`: Local mock endpoint updating in-memory store `lib/escrowStore.ts`.
- **Consolidation Target**: Migrate `lib/stellar.ts` and direct page fetches onto `lib/api/client.ts` to share transport, retry, and auth refresh logic.
- **Detailed Matrix Reference**: For a comprehensive map of all 19 canonical client endpoints, auth helper functions, local route handlers, request/response payload types, and singular/plural fallback conventions, see [Frontend API Endpoint & Authentication Matrix](docs/API_MATRIX.md).

### 3. Server Components vs Client Pages

- Documentation previously stated all pages are thin wrappers composing domain components.
- In practice:
  - **Server Components with Data Fetching**: `app/pay/[escrowId]/page.tsx` is an async Server Component that executes `getEscrow(escrowId)` during server render (`generateMetadata`) to produce dynamic Open Graph metadata and title tags before streaming HTML.
  - **Dynamic Client Pages**: `app/dashboard/page.tsx` and `app/create/page.tsx` serve as lightweight entry points wrapping client-side state managers (`DashboardClient`, `EscrowCreateForm`) inside React `<Suspense>` boundaries.

---

## Escrow Lifecycle Flow

1. **Escrow Creation**: A vendor connects their wallet via `WalletProvider` (`useWallet`), inputs terms in `EscrowCreateForm`, and submits via `createEscrow()` (`POST /escrow`).
2. **Buyer Payment**:
   - The buyer accesses `app/pay/[escrowId]/page.tsx`. Server metadata loads the item title and amount.
   - `PaymentForm` checks mock flags (`NEXT_PUBLIC_USE_MOCKS` and `NEXT_PUBLIC_ESCROW_MOCK_PAYMENTS`). For full documentation of flags, stages, and boundaries, see [Payment Mock Flags & Production Funding Boundaries](docs/PAYMENT_BOUNDARIES.md).
   - In production/testnet, `buildFundingTransactionXdr()` constructs the Soroban `fund_escrow` invocation, the buyer signs via Freighter (`signTransaction`), and `submitTransaction()` submits the signed XDR to the Soroban RPC, polling until ledger inclusion.
3. **Fulfillment & Shipping**:
   - The vendor opens `ShipTrackingModal` on the dashboard and submits tracking details via `shipEscrow()` (`POST /escrows/:id/ship`).
   - The buyer tracks package movement in `TrackingTimeline` (`GET /escrows/:id/tracking`).
4. **Delivery Confirmation / Funds Release**:
   - The buyer confirms receipt in `TrackingTimeline`, invoking `confirmDelivery()` (`POST /escrows/:id/confirm`) to release funds to the vendor.
5. **Dispute Handling**:
   - In case of a defect or non-delivery, either party submits `DisputeForm` via `createDispute()` (`POST /escrows/:id/dispute`).
   - Admins review active disputes in `app/admin/disputes/page.tsx` (`GET /disputes?status=OPEN,UNDER_REVIEW`) and execute resolutions via `resolveDispute()` (`PATCH /disputes/:id/resolve`).

---

## Further Reading

- [Soroban Contract Integration](docs/SOROBAN_CONTRACT_INTEGRATION.md): how the frontend builds, signs, submits and confirms contract transactions, including confirmation polling, timeouts and known gaps.
- [Payment Mock Flags & Production Funding Boundaries](docs/PAYMENT_BOUNDARIES.md): what mock flags change and what counts as real settlement.
