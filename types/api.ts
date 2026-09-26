/**
 * Issue #425 — strict response contracts for the external TrustLink API.
 *
 * Every network boundary in the app (server components, route handlers, client
 * fetches) should annotate its parsed JSON with one of the aliases below rather
 * than relying on the implicit `any` that `Response.json()` returns. When the
 * backend changes shape, the mismatch surfaces at compile time instead of as a
 * runtime `undefined`.
 *
 * Naming convention: `<Verb><Resource>Response`. Aliases to the domain models in
 * `@/types` are intentional — they document *which* endpoint returns *which*
 * model while keeping a single source of truth for the model itself.
 */

import type {
  Dispute,
  Escrow,
  EscrowStatus,
  Subscription,
  Tracking,
  VendorAnalyticsApiResponse,
  VendorAnalyticsResponse,
  VendorNotificationPreferences,
  VendorProfile,
} from "@/types";

/* -------------------------------------------------------------------------- */
/* Errors                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Shape of a non-2xx JSON body. The API is inconsistent about which key holds
 * the human-readable text, so all three are optional and callers should fall
 * back in `message → error → details` order.
 */
export interface ApiErrorResponse {
  message?: string;
  error?: string;
  details?: string;
  statusCode?: number;
}

/* -------------------------------------------------------------------------- */
/* Auth — SEP-10 style challenge / verify                                     */
/* -------------------------------------------------------------------------- */

/** `POST /auth/challenge` — unsigned challenge transaction for the wallet. */
export interface AuthChallengeResponse {
  transaction: string;
  network_passphrase?: string;
}

/** `POST /auth/verify` — JWT issued once the signed challenge is validated. */
export interface AuthVerifyResponse {
  token: string;
}

/* -------------------------------------------------------------------------- */
/* Escrows                                                                    */
/* -------------------------------------------------------------------------- */

/** `POST /escrow` — returns the shareable payment link, not the escrow itself. */
export interface CreateEscrowResponse {
  url: string;
}

/** `GET /escrow/:id` (falls back to `GET /escrows/:id`). */
export type GetEscrowResponse = Escrow;

/** `GET /vendor/escrows`. */
export type GetVendorEscrowsResponse = Escrow[];

/**
 * `POST /escrows/:id/fund` — the transaction hash key is not stable across API
 * versions, hence the three optional aliases.
 */
export interface FundEscrowResponse {
  txHash?: string;
  transactionHash?: string;
  hash?: string;
  escrowId?: string;
  status?: EscrowStatus;
}

/** `POST /escrows/:id/confirm` — buyer releases funds to the vendor. */
export interface ConfirmDeliveryResponse {
  escrowId?: string;
  status?: EscrowStatus;
  txHash?: string;
}

/** `POST|PATCH /escrows/:id/ship` — shipment details echoed back as tracking. */
export type ShipEscrowResponse = Tracking;

/** `DELETE /escrow/:id` or `PATCH /escrow/:id/cancel` — cancels an unfunded escrow. */
export interface CancelEscrowResponse {
  success: boolean;
  escrowId: string;
  message?: string;
}

/** `GET /escrows/:id/tracking`. */
export type GetTrackingResponse = Tracking;

/* -------------------------------------------------------------------------- */
/* Disputes                                                                   */
/* -------------------------------------------------------------------------- */

/** `GET /disputes/:id`. */
export type GetDisputeResponse = Dispute;

/** `GET /disputes?status=…` — admin queue. */
export type GetDisputesResponse = Dispute[];

/** `POST /escrows/:id/dispute`. */
export type CreateDisputeResponse = Dispute;

/** `PATCH /disputes/:id/resolve`. */
export type ResolveDisputeResponse = Dispute;

/**
 * `POST /api/dispute` — the multi-step support form posts to an internal route
 * rather than the escrow dispute endpoint, so it has its own envelope.
 */
export interface SubmitDisputeFormResponse {
  id?: string;
  reference?: string;
  message?: string;
}

/* -------------------------------------------------------------------------- */
/* Vendor / subscription                                                      */
/* -------------------------------------------------------------------------- */

/** `GET /subscription`. */
export type GetSubscriptionResponse = Subscription;

/** `POST /subscription/upgrade`. */
export type UpgradeSubscriptionResponse = Subscription;

/** `GET /vendor/notifications`. */
export type GetVendorNotificationPreferencesResponse = VendorNotificationPreferences;

/** Raw `GET /vendor/analytics` response before client-side normalization. */
export type GetVendorAnalyticsApiResponse = VendorAnalyticsApiResponse;

/** Normalized `GET /vendor/analytics` response exposed to consumers. */
export type GetVendorAnalyticsResponse = VendorAnalyticsResponse;

/** `GET /vendor/:id/profile` — public vendor profile, no auth required. */
export type GetVendorProfileResponse = VendorProfile;

/** `GET /vendor/:id/escrows` — a vendor's publicly listed escrow links. */
export type GetPublicVendorEscrowsResponse = Escrow[];

/**
 * Endpoints that answer with `204 No Content` (or an empty body we ignore):
 * `PATCH /vendor/notifications`, `PATCH /escrow/:id/buyer-contact`.
 */
export type EmptyResponse = void;
