# Frontend API Endpoint & Authentication Matrix

This document provides a source-derived reference for all HTTP endpoints, methods, payload types, authentication expectations, and caller locations in the TrustLink frontend. It documents the canonical API client (`lib/api/client.ts`), direct authentication helpers (`lib/stellar.ts`), and local Next.js Route Handlers (`app/`).

---

## 1. Comprehensive Endpoint Matrix

| Operation / Export | HTTP Method | Endpoint Path | Request Payload Type | Response Payload Type | Auth Expectation (Client) | Backend Authorization Scope | Call Sites / Callers |
|---|---|---|---|---|---|---|---|
| `createEscrow` | `POST` | `/escrow` | `EscrowInput` | `CreateEscrowResponse` | Optional Bearer token (`token?: string`) | Vendor identity validated if token provided | `components/escrow/EscrowCreateForm.tsx` (via `useEscrow`), `app/escrow/route.ts` |
| `getEscrow` | `GET` | `/escrow/:id`<br/>*(fallback: `/escrows/:id` on 404)* | None | `GetEscrowResponse`<br/>*(validated via `isEscrow`)* | Optional Bearer token (`token?: string`) | Publicly viewable; vendor/buyer fields populated if authorized | `app/pay/[escrowId]/page.tsx` (`generateMetadata` on server), `PaymentEscrowClient.tsx`, `components/payment/PaymentSection.tsx` |
| `getVendorEscrows` | `GET` | `/vendor/escrows` | None | `GetVendorEscrowsResponse` (`Escrow[]`) | Bearer token (`token?: string`) | Vendor role; returns only escrows created by the authenticated vendor | `components/providers/NotificationProvider.tsx` (30s poll), `hooks/useEscrow.ts`, `app/dashboard/DashboardClient.tsx`, `app/escrow/route.ts` |
| `getVendorProfile` | `GET` | `/vendor/:id/profile` | None | `GetVendorProfileResponse` | Public (no token sent) | Public vendor details (reputation, public key, stats) | Vendor profile views (`components/dashboard/`, `app/vendor/`) |
| `getPublicVendorEscrows` | `GET` | `/vendor/:id/escrows` | None | `GetPublicVendorEscrowsResponse` (`Escrow[]`) | Public (no token sent) | Publicly listed escrows for given vendor address | Vendor storefront / public link directory |
| `confirmDelivery` | `POST` | `/escrows/:escrowId/confirm` | None (`{}`) | `ConfirmDeliveryResponse` | Optional Bearer token (`token?: string`) | Buyer authorization; must be the buyer associated with the escrow | `components/tracking/TrackingTimeline.tsx` |
| `cancelEscrow` | `PATCH` | `/escrow/:escrowId/cancel` | None (`{}`) | `CancelEscrowResponse` | Optional Bearer token (`token?: string`) | Vendor authorization; escrow must be in `PENDING`/unfunded state | `components/dashboard/useCancelEscrow.ts` |
| `getDispute` | `GET` | `/disputes/:id` | None | `GetDisputeResponse`<br/>*(validated via `isDispute`)* | Optional Bearer token (`token?: string`) | Buyer, vendor, or admin party | Dispute modal & review views |
| `getAdminDisputes` | `GET` | `/disputes?status=OPEN,UNDER_REVIEW` | None (query string) | `GetDisputesResponse` (`Dispute[]`) | Bearer token (`token?: string`) | **Admin role required**; 403 Forbidden for non-admin tokens | `app/admin/disputes/page.tsx` |
| `resolveDispute` | `PATCH` | `/disputes/:id/resolve` | `{ resolution: "RELEASE_TO_VENDOR" \| "REFUND_BUYER" }` | `ResolveDisputeResponse`<br/>*(validated via `isDispute`)* | Bearer token (`token?: string`) | **Admin role required**; settles dispute on backend | `app/admin/disputes/page.tsx` |
| `createDispute` | `POST` | `/escrows/:escrowId/dispute` | `CreateDisputeInput` | `CreateDisputeResponse` | Optional Bearer token (`token?: string`) | Buyer or vendor party to the escrow | `components/escrow/DisputeForm.tsx` |
| `shipEscrow` | `POST` | `/escrows/:escrowId/ship` | `ShipEscrowInput` | `ShipEscrowResponse`<br/>*(validated via `isTracking`)* | Optional Bearer token (`token?: string`) | Vendor authorization; escrow must be `FUNDED` | `components/dashboard/ShipTrackingModal.tsx` |
| `getTracking` | `GET` | `/escrows/:escrowId/tracking` | None | `GetTrackingResponse`<br/>*(validated via `isTracking`)* | Optional Bearer token (`token?: string`) | Public/buyer/vendor tracking visibility | `hooks/useTracking.ts` (`fetchTracking`) |
| `getSubscription` | `GET` | `/subscription` | None | `GetSubscriptionResponse`<br/>*(validated via `isSubscription`)* | Optional Bearer token (`token?: string`) | Authenticated vendor; returns user plan (`FREE` / `PRO`) | `components/providers/SubscriptionProvider.tsx` |
| `upgradeSubscription` | `POST` | `/subscription/upgrade` | None (`{}`) | `UpgradeSubscriptionResponse` | Optional Bearer token (`token?: string`) | Authenticated vendor; upgrades plan to `PRO` | `components/providers/SubscriptionProvider.tsx`, `components/subscription/UpgradeCTA.tsx` |
| `getVendorNotificationPreferences` | `GET` | `/vendor/notifications` | None | `GetVendorNotificationPreferencesResponse` | **Required** Bearer token (`token: string`) | Authenticated vendor | Notification settings views |
| `patchVendorNotifications` | `PATCH` | `/vendor/notifications` | `VendorNotificationPreferences` | `EmptyResponse` (`void`) | **Required** Bearer token (`token: string`) | Authenticated vendor; updates delivery preferences | Notification settings views |
| `patchBuyerContact` | `PATCH` | `/escrow/:escrowId/buyer-contact` | `{ email?: string; phone?: string; emailReceipt?: boolean }` | `EmptyResponse` (`void`) | Optional Bearer token (`token?: string`) | Buyer or public creator update for receipts | `components/payment/PaymentForm.tsx` |
| `getVendorAnalytics` | `GET` | `/vendor/analytics` | None | `GetVendorAnalyticsResponse` | Optional Bearer token (`token?: string`) | Authenticated vendor; returns revenue, volume, and chart points | `components/dashboard/VendorAnalyticsSection.tsx` |

---

## 2. Direct Authentication Helpers (`lib/stellar.ts`)

Stellar SEP-10 challenge-response authentication bypasses the canonical API client (`lib/api/client.ts`) and uses direct `fetch` calls to backend authentication endpoints:

| Function | HTTP Method | Endpoint Path | Request Body | Response Body | Auth Status | Notes |
|---|---|---|---|---|---|---|
| `getChallenge` | `POST` | `/auth/challenge` | `{ publicKey: string }` | `AuthChallengeResponse`<br/>(`{ transaction: string }`) | Public (unauthenticated) | Requests an unsigned SEP-10 challenge transaction XDR from the backend. |
| `verifyChallenge` | `POST` | `/auth/verify` | `{ signedTransaction: string }` or `{ transaction: string }` | `AuthVerifyResponse`<br/>(`{ token: string }`) | Public (unauthenticated submission of signature) | Submits client-signed challenge transaction XDR. If signature is valid, backend returns a signed JWT. |

---

## 3. Local Next.js Route Handlers (`app/`)

Next.js App Router exposes server route handlers under `app/`. These run inside the Next.js Node.js server runtime:

| Route File | HTTP Method | Route URL | Purpose & Implementation | Auth Mechanism | Handled Locally vs Proxied |
|---|---|---|---|---|---|
| `app/escrow/route.ts` | `GET` | `/escrow` | Rate-limited (`RATE_LIMITS.escrowRead`) proxy returning the vendor's escrows. | `requireAuth(request)` reads `Authorization: Bearer <jwt>`. Rejects with 401 if missing/invalid. | **Proxied**: Calls `getVendorEscrows(auth.token)` against the backend API. |
| `app/escrow/route.ts` | `POST` | `/escrow` | Rate-limited (`RATE_LIMITS.escrowWrite`) proxy creating a new escrow. Validates body against `EscrowCreateSchema`. | `requireAuth(request)` reads `Authorization: Bearer <jwt>`. | **Proxied**: Calls `createEscrow(parsed.data, auth.token)` against the backend API. |
| `app/escrow/[id]/ship/route.ts` | `PATCH` | `/escrow/:id/ship` | **Local Mock Handler**: Updates escrow shipment status in the server's local in-memory store. Validates body with `ShipEscrowSchema`. | `requireAuth(request)` reads `Authorization: Bearer <jwt>`. | **Local In-Memory Mock**: Calls `shipEscrow()` from `@/lib/escrowStore`.<br/>*Discrepancy Note*: Local route is `PATCH /escrow/:id/ship`, whereas backend API is `POST /escrows/:id/ship`. |
| `app/api/og/route.tsx` | `GET` | `/api/og` | Dynamic Open Graph image generation using `@vercel/og` (`ImageResponse`). | Public (unauthenticated). | **Local Server Route**: Dynamically renders PNG metadata preview cards. |

---

## 4. Authentication Expectations vs Backend Authorization Guarantees

The frontend client maintains a clear boundary between client-side credential transport and backend authorization enforcement:

1. **Client-Side Authentication**:
   - When a token is available in context or `localStorage` (`wallet.jwt` / `SESSION_KEY`), `request()` automatically attaches:
     ```http
     Authorization: Bearer <token>
     ```
   - For public endpoints (`/vendor/:id/profile`, `/vendor/:id/escrows`, `/auth/challenge`, `/auth/verify`), no `Authorization` header is dispatched.
   - For endpoints accepting `token?: string`, omitting the token allows public reads where permitted by the server, while supplying a token allows the server to populate role-specific fields.

2. **Backend Authorization Enforcement**:
   - Supplying a valid JWT confirms wallet identity (authentication), but backend authorization guarantees permissions:
     - Escrow modifications (`cancelEscrow`, `shipEscrow`) require the caller to be the verified vendor of record.
     - Delivery confirmation (`confirmDelivery`) requires the caller to be the recorded buyer.
     - Dispute resolution (`resolveDispute`, `getAdminDisputes`) strictly requires an admin claim in the JWT. Passing a normal vendor/buyer token will result in a `403 Forbidden`.

3. **Automatic Session Invalidation (HTTP 401)**:
   - When an authenticated request fails with `401 Unauthorized`, the client layer in `lib/api/client.ts` triggers `handleSessionExpired()`.
   - This cleans up local state:
     - Removes `wallet.jwt` and `wallet.publicKey` from `localStorage`.
     - Resets the logger user context (`setLoggerUser(null)`).
     - Dispatches `SESSION_EXPIRED_EVENT` (`trustlink:session-expired`) across the browser window.
     - Prompts user re-authentication without individual components having to implement manual 401 listeners.

---

## 5. Endpoint Families & Plural/Singular Fallback Conventions

The backend API exhibits mixed URL conventions across development iterations. The frontend handles these transparently:

### Singular vs Plural Endpoint Families

- **Singular Family (`/escrow`)**:
  - `POST /escrow`: Create escrow.
  - `GET /escrow/:id`: Fetch escrow (with fallback).
  - `PATCH /escrow/:id/cancel`: Cancel unfunded escrow.
  - `PATCH /escrow/:id/buyer-contact`: Attach buyer contact info.
  - Local routes: `app/escrow/route.ts` (`GET /escrow`, `POST /escrow`), `app/escrow/[id]/ship/route.ts`.

- **Plural Family (`/escrows`)**:
  - `GET /escrows/:id`: Plural endpoint fallback for single escrow lookup.
  - `POST /escrows/:escrowId/confirm`: Confirm delivery and release funds.
  - `POST /escrows/:escrowId/dispute`: Raise dispute on an escrow.
  - `POST /escrows/:escrowId/ship`: Mark item shipped with tracking ID.
  - `GET /escrows/:escrowId/tracking`: Query shipment tracking history.

- **Namespaced Endpoint Families**:
  - `/vendor/*`: Vendor management (`/vendor/escrows`, `/vendor/:id/profile`, `/vendor/:id/escrows`, `/vendor/notifications`, `/vendor/analytics`).
  - `/disputes/*`: Dispute administration (`/disputes/:id`, `/disputes?status=...`, `/disputes/:id/resolve`).
  - `/subscription/*`: Gated tier management (`/subscription`, `/subscription/upgrade`).
  - `/auth/*`: SEP-10 authentication helpers (`/auth/challenge`, `/auth/verify`).

### Automatic Fallback Mechanism (`getEscrow`)

Because some backend deployments route single escrows under `/escrow/:id` while others route under `/escrows/:id`, `lib/api/client.ts` implements an automated fallback in `getEscrow()`:

```typescript
export async function getEscrow(id: string, token?: string): Promise<GetEscrowResponse> {
  try {
    return await request<GetEscrowResponse>(`/escrow/${id}`, {}, token, isEscrow);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      // Fallback to plural path when singular route returns 404
      return request<GetEscrowResponse>(`/escrows/${id}`, {}, token, isEscrow);
    }
    throw error;
  }
}
```

This guarantees resilient lookups across disparate backend environments without leaking fallback logic into UI components.
