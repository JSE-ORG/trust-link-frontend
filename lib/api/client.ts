/**
 * Canonical HTTP client for the TrustLink API.
 *
 * Every network call in the app goes through the {@link request} helper or one
 * of the endpoint functions exported here — components and hooks import these
 * via the `@/lib/api` barrel rather than calling `fetch` themselves, so auth
 * headers, error mapping and response validation stay in exactly one place.
 */

import { handleSessionExpired } from "@/lib/session";
import type { VendorNotificationPreferences } from "@/types";
import type {
  ApiErrorResponse,
  CancelEscrowResponse,
  ConfirmDeliveryResponse,
  CreateDisputeResponse,
  CreateEscrowResponse,
  EmptyResponse,
  GetDisputeResponse,
  GetDisputesResponse,
  GetEscrowResponse,
  GetPublicVendorEscrowsResponse,
  GetSubscriptionResponse,
  GetTrackingResponse,
  GetVendorAnalyticsApiResponse,
  GetVendorAnalyticsResponse,
  GetVendorEscrowsResponse,
  GetVendorNotificationPreferencesResponse,
  GetVendorProfileResponse,
  ResolveDisputeResponse,
  ShipEscrowResponse,
  UpgradeSubscriptionResponse,
} from "@/types/api";
import {
  isDispute,
  isEscrow,
  isSubscription,
  isTracking,
} from "@/types/guards";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/** @deprecated Use `ApiErrorResponse` from `@/types/api`. Kept for existing imports. */
export type ApiErrorShape = ApiErrorResponse;

/**
 * Error thrown for every non-2xx API response. Carries the HTTP status and the
 * parsed body so callers can branch on `status` (e.g. a 404 fallback) while
 * still surfacing the server's human-readable `message`.
 */
export class ApiError extends Error {
  status: number;
  body?: ApiErrorResponse;

  constructor(status: number, message: string, body?: ApiErrorResponse) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export interface EscrowInput {
  itemName: string;
  priceUSDC: string;
  description: string;
  shippingWindow: string;
}

export type EscrowResponse = CreateEscrowResponse;

export interface CreateDisputeInput {
  reason: string;
  description: string;
  evidence: string[];
}

export interface ShipEscrowInput {
  trackingId: string;
  carrier?: string;
}

/**
 * Turns a failed response into an {@link ApiError}. The API is inconsistent
 * about which key holds the readable text, so `message → error → details` is
 * tried before falling back to the raw body or the HTTP status text.
 *
 * @param res - The non-2xx response to describe.
 * @returns The error to throw for this response.
 */
async function parseError(res: Response): Promise<ApiError> {
  const body = await res.text();
  try {
    const json = JSON.parse(body) as ApiErrorResponse;
    return new ApiError(
      res.status,
      json.message || json.error || json.details || res.statusText,
      json,
    );
  } catch {
    return new ApiError(res.status, body || res.statusText, undefined);
  }
}

/** Narrows a parsed JSON payload to its declared response type. */
type ResponseGuard<T> = (value: unknown) => value is T;

/**
 * Performs a single authenticated request and validates the parsed payload.
 *
 * A 401 on an authenticated request tears down the wallet session exactly once,
 * at this layer, so no caller has to remember to do it.
 *
 * @param path - Path appended to {@link API_URL}, e.g. `/escrows/1/confirm`.
 * @param init - Standard fetch init object.
 * @param token - Optional Bearer auth token.
 * @param validate - Optional shape guard; a mismatch is reported as an error
 *                   rather than silently typing the payload as `T`.
 * @returns The parsed JSON body, or `undefined` for empty responses.
 */
async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
  validate?: ResponseGuard<T>,
): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    cache: init.cache ?? "no-store",
  });
  if (!res.ok) {
    if (res.status === 401 && token && typeof window !== "undefined") {
      handleSessionExpired();
    }
    throw await parseError(res);
  }

  const text = await res.text();
  let response: unknown;
  try {
    response = text ? JSON.parse(text) : undefined;
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : "malformed JSON";
    throw new Error(`Invalid API response for ${path}: ${reason}`);
  }
  if (validate && !validate(response)) {
    throw new Error(
      `Invalid API response for ${path}: unexpected response shape`,
    );
  }

  return response as T;
}

/**
 * Flattens whichever array key the API version used into `dataPoints`.
 *
 * @param response - Raw analytics payload from the API.
 * @returns The same payload with a populated `dataPoints` array.
 */
export function normalizeVendorAnalyticsResponse(
  response: GetVendorAnalyticsApiResponse,
): GetVendorAnalyticsResponse {
  return {
    ...response,
    dataPoints: response.dailyMetrics ?? response.series ?? response.data ?? [],
  };
}

/**
 * Creates a new escrow payment request.
 *
 * @param data - Input parameters including item name, price in USDC, description, and shipping window.
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to the created escrow response.
 */
export async function createEscrow(
  data: EscrowInput,
  token?: string,
): Promise<CreateEscrowResponse> {
  return request<CreateEscrowResponse>(
    "/escrow",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    token,
  );
}

/**
 * Fetches escrow details by ID. Falls back to `/escrows/{id}` if `/escrow/{id}` returns 404.
 *
 * @param id - The unique escrow ID.
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to the escrow details.
 */
export async function getEscrow(
  id: string,
  token?: string,
): Promise<GetEscrowResponse> {
  try {
    return await request<GetEscrowResponse>(`/escrow/${id}`, {}, token, isEscrow);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return request<GetEscrowResponse>(`/escrows/${id}`, {}, token, isEscrow);
    }
    throw error;
  }
}

/**
 * Fetches all escrows associated with the authenticated vendor.
 *
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to the vendor's list of escrows.
 */
export async function getVendorEscrows(
  token?: string,
): Promise<GetVendorEscrowsResponse> {
  return request<GetVendorEscrowsResponse>("/vendor/escrows", {}, token);
}

/**
 * Fetches a vendor's public profile. No authentication is required.
 *
 * @param id - The vendor ID (their Stellar public key).
 * @returns Promise resolving to the vendor profile.
 */
export async function getVendorProfile(
  id: string,
): Promise<GetVendorProfileResponse> {
  return request<GetVendorProfileResponse>(`/vendor/${id}/profile`);
}

/**
 * Fetches a vendor's publicly listed escrow links. No authentication is required.
 *
 * @param id - The vendor ID (their Stellar public key).
 * @returns Promise resolving to the public listing.
 */
export async function getPublicVendorEscrows(
  id: string,
): Promise<GetPublicVendorEscrowsResponse> {
  return request<GetPublicVendorEscrowsResponse>(`/vendor/${id}/escrows`);
}

/**
 * Buyer confirms delivery, releasing the escrowed funds to the vendor.
 *
 * @param escrowId - The escrow ID.
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to the confirm-delivery response.
 */
export async function confirmDelivery(
  escrowId: string,
  token?: string,
): Promise<ConfirmDeliveryResponse> {
  return request<ConfirmDeliveryResponse>(`/escrows/${escrowId}/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, token);
}

/**
 * Cancels an escrow that has not been funded yet.
 *
 * @param escrowId - The escrow ID.
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to the cancellation response.
 */
export async function cancelEscrow(
  escrowId: string,
  token?: string,
): Promise<CancelEscrowResponse> {
  return request<CancelEscrowResponse>(
    `/escrow/${escrowId}/cancel`,
    { method: "PATCH", headers: { "Content-Type": "application/json" } },
    token,
  );
}

/**
 * Fetches details of a specific dispute.
 *
 * @param id - The dispute ID.
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to dispute details.
 */
export async function getDispute(
  id: string,
  token?: string,
): Promise<GetDisputeResponse> {
  return request<GetDisputeResponse>(`/disputes/${id}`, {}, token, isDispute);
}

/**
 * Fetches open and under-review disputes for admin resolution.
 *
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to filtered list of active disputes.
 */
export async function getAdminDisputes(
  token?: string,
): Promise<GetDisputesResponse> {
  const disputes = await request<GetDisputesResponse>(
    "/disputes?status=OPEN,UNDER_REVIEW",
    {},
    token,
  );
  return disputes.filter(
    (dispute) => dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW",
  );
}

/**
 * Resolves an active dispute as admin by either releasing funds to vendor or refunding buyer.
 *
 * @param id - The dispute ID.
 * @param resolution - The resolution action ("RELEASE_TO_VENDOR" or "REFUND_BUYER").
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to the resolution response.
 */
export async function resolveDispute(
  id: string,
  resolution: "RELEASE_TO_VENDOR" | "REFUND_BUYER",
  token?: string,
): Promise<ResolveDisputeResponse> {
  return request<ResolveDisputeResponse>(
    `/disputes/${id}/resolve`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resolution }),
    },
    token,
    isDispute,
  );
}

/**
 * Creates a dispute for an existing escrow.
 *
 * @param escrowId - The escrow ID.
 * @param data - Dispute reason, description, and evidence array.
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to the created dispute details.
 */
export async function createDispute(
  escrowId: string,
  data: CreateDisputeInput,
  token?: string,
): Promise<CreateDisputeResponse> {
  return request<CreateDisputeResponse>(
    `/escrows/${escrowId}/dispute`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    token,
  );
}

/**
 * Marks an escrow item as shipped with tracking information.
 *
 * @param escrowId - The escrow ID.
 * @param data - Tracking ID and optional carrier.
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to ship escrow response.
 */
export async function shipEscrow(
  escrowId: string,
  data: ShipEscrowInput,
  token?: string,
): Promise<ShipEscrowResponse> {
  return request<ShipEscrowResponse>(
    `/escrows/${escrowId}/ship`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    token,
    isTracking,
  );
}

/**
 * Fetches tracking information for a given escrow.
 *
 * @param escrowId - The escrow ID.
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to tracking details.
 */
export async function getTracking(
  escrowId: string,
  token?: string,
): Promise<GetTrackingResponse> {
  return request<GetTrackingResponse>(
    `/escrows/${escrowId}/tracking`,
    {},
    token,
    isTracking,
  );
}

/**
 * Fetches current subscription details for the authenticated user/vendor.
 *
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to subscription response.
 */
export async function getSubscription(
  token?: string,
): Promise<GetSubscriptionResponse> {
  return request<GetSubscriptionResponse>("/subscription", {}, token, isSubscription);
}

/**
 * Upgrades the user's subscription level.
 *
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to upgrade response.
 */
export async function upgradeSubscription(
  token?: string,
): Promise<UpgradeSubscriptionResponse> {
  return request<UpgradeSubscriptionResponse>(
    "/subscription/upgrade",
    { method: "POST", headers: { "Content-Type": "application/json" } },
    token,
  );
}

/**
 * Fetches vendor notification preferences.
 *
 * @param token - Required Bearer auth token.
 * @returns Promise resolving to vendor notification preferences.
 */
export async function getVendorNotificationPreferences(
  token: string,
): Promise<GetVendorNotificationPreferencesResponse> {
  return request<GetVendorNotificationPreferencesResponse>(
    "/vendor/notifications",
    {},
    token,
  );
}

/**
 * Updates vendor notification preferences.
 *
 * @param prefs - Updated notification preference flags.
 * @param token - Required Bearer auth token.
 * @returns Promise resolving to empty response upon success.
 */
export async function patchVendorNotifications(
  prefs: VendorNotificationPreferences,
  token: string,
): Promise<EmptyResponse> {
  await request<EmptyResponse>(
    "/vendor/notifications",
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(prefs),
    },
    token,
  );
}

/**
 * Updates buyer contact information for an escrow.
 *
 * @param escrowId - The escrow ID.
 * @param data - Optional email and/or phone number.
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to empty response upon success.
 */
export async function patchBuyerContact(
  escrowId: string,
  data: { email?: string; phone?: string },
  token?: string,
): Promise<EmptyResponse> {
  await request<EmptyResponse>(
    `/escrow/${escrowId}/buyer-contact`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    },
    token,
  );
}

/**
 * Fetches vendor analytics data points and statistics, normalized to `dataPoints`.
 *
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to vendor analytics payload.
 */
export async function getVendorAnalytics(
  token?: string,
): Promise<GetVendorAnalyticsResponse> {
  const response = await request<GetVendorAnalyticsApiResponse>(
    "/vendor/analytics",
    {},
    token,
  );
  return normalizeVendorAnalyticsResponse(response);
}

/**
 * Return type of {@link createApiClient}. Each method is a thin wrapper around
 * the corresponding standalone API function, pre-bound to the supplied token.
 */
export interface ApiClient {
  createEscrow: (data: EscrowInput) => Promise<CreateEscrowResponse>;
  getEscrow: (id: string) => Promise<GetEscrowResponse>;
  getVendorEscrows: () => Promise<GetVendorEscrowsResponse>;
  cancelEscrow: (escrowId: string) => Promise<CancelEscrowResponse>;
  confirmDelivery: (escrowId: string) => Promise<ConfirmDeliveryResponse>;
  getDispute: (id: string) => Promise<GetDisputeResponse>;
  getAdminDisputes: () => Promise<GetDisputesResponse>;
  resolveDispute: (
    id: string,
    resolution: "RELEASE_TO_VENDOR" | "REFUND_BUYER"
  ) => Promise<ResolveDisputeResponse>;
  createDispute: (
    escrowId: string,
    data: CreateDisputeInput,
  ) => Promise<CreateDisputeResponse>;
  shipEscrow: (
    escrowId: string,
    data: ShipEscrowInput,
  ) => Promise<ShipEscrowResponse>;
  getTracking: (escrowId: string) => Promise<GetTrackingResponse>;
  getSubscription: () => Promise<GetSubscriptionResponse>;
  upgradeSubscription: () => Promise<UpgradeSubscriptionResponse>;
  getVendorNotificationPreferences: (
    authToken?: string,
  ) => Promise<GetVendorNotificationPreferencesResponse>;
  patchVendorNotifications: (
    prefs: VendorNotificationPreferences,
    authToken?: string,
  ) => Promise<EmptyResponse>;
  patchBuyerContact: (
    escrowId: string,
    data: { email?: string; phone?: string },
  ) => Promise<EmptyResponse>;
  getVendorAnalytics: () => Promise<GetVendorAnalyticsResponse>;
}

/**
 * Binds the standalone API functions to a single Bearer token.
 *
 * @param token - The JWT to send with every request.
 * @returns An object exposing one method per endpoint, pre-bound to `token`.
 */
export function createApiClient(token?: string): ApiClient {
  return {
    createEscrow: (data: EscrowInput) => createEscrow(data, token),
    getEscrow: (id: string) => getEscrow(id, token),
    getVendorEscrows: () => getVendorEscrows(token),
    cancelEscrow: (escrowId: string) => cancelEscrow(escrowId, token),
    confirmDelivery: (escrowId: string) => confirmDelivery(escrowId, token),
    getDispute: (id: string) => getDispute(id, token),
    getAdminDisputes: () => getAdminDisputes(token),
    resolveDispute: (
      id: string,
      resolution: "RELEASE_TO_VENDOR" | "REFUND_BUYER",
    ) => resolveDispute(id, resolution, token),
    createDispute: (escrowId: string, data: CreateDisputeInput) =>
      createDispute(escrowId, data, token),
    shipEscrow: (escrowId: string, data: ShipEscrowInput) =>
      shipEscrow(escrowId, data, token),
    getTracking: (escrowId: string) => getTracking(escrowId, token),
    getSubscription: () => getSubscription(token),
    upgradeSubscription: () => upgradeSubscription(token),
    getVendorNotificationPreferences: (authToken = token ?? "") =>
      getVendorNotificationPreferences(authToken),
    patchVendorNotifications: (
      prefs: VendorNotificationPreferences,
      authToken = token ?? "",
    ) => patchVendorNotifications(prefs, authToken),
    patchBuyerContact: (escrowId: string, data: { email?: string; phone?: string }) =>
      patchBuyerContact(escrowId, data, token),
    getVendorAnalytics: () => getVendorAnalytics(token),
  };
}