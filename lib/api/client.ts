import type {
  VendorAnalyticsApiResponse,
  VendorAnalyticsResponse,
  VendorNotificationPreferences,
} from "@/types";
import type {
  ApiErrorResponse,
  CancelEscrowResponse,
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

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/** @deprecated Use `ApiErrorResponse` from `@/types/api`. Kept for existing imports. */
export type ApiErrorShape = ApiErrorResponse;

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

async function parseError(res: Response): Promise<ApiError> {
  const body = await res.text();
  try {
    const json = JSON.parse(body) as ApiErrorResponse;
    return new ApiError(res.status, json.message || json.error || json.details || res.statusText, json);
  } catch {
    return new ApiError(res.status, body || res.statusText, undefined);
  }
}

type ResponseGuard<T> = (value: unknown) => value is T;

async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
  validate?: ResponseGuard<T>
): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: init.cache ?? "no-store" });
  if (!res.ok) {
    if (res.status === 401 && token && typeof window !== "undefined") {
      window.localStorage.removeItem("wallet.jwt");
      window.location.href = "/";
    }
    throw await parseError(res);
  }

  const text = await res.text();
  let response: unknown;
  try {
    response = text ? JSON.parse(text) : undefined;
  } catch {
    throw new Error(`Invalid API response for ${path}: malformed JSON`);
  }
  if (validate && !validate(response)) {
    throw new Error(`Invalid API response for ${path}: unexpected response shape`);
  }

  return response as T;
}

export function normalizeVendorAnalyticsResponse(
  response: VendorAnalyticsApiResponse
): VendorAnalyticsResponse {
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
export async function createEscrow(data: EscrowInput, token?: string): Promise<CreateEscrowResponse> {
  return request<CreateEscrowResponse>("/escrow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }, token);
}

/**
 * Fetches escrow details by ID. Falls back to `/escrows/{id}` if `/escrow/{id}` returns 404.
 *
 * @param id - The unique escrow ID.
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to the escrow details.
 */
export async function getEscrow(id: string, token?: string): Promise<GetEscrowResponse> {
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
export async function getVendorEscrows(token?: string): Promise<GetVendorEscrowsResponse> {
  return request<GetVendorEscrowsResponse>("/vendor/escrows", {}, token, (value): value is GetVendorEscrowsResponse =>
    Array.isArray(value) && value.every(isEscrow)
  );
}

/**
 * Fetches details of a specific dispute.
 *
 * @param id - The dispute ID.
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to dispute details.
 */
export async function getDispute(id: string, token?: string): Promise<GetDisputeResponse> {
  return request<GetDisputeResponse>(`/disputes/${id}`, {}, token, isDispute);
}

/**
 * Fetches open and under-review disputes for admin resolution.
 *
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to filtered list of active disputes.
 */
export async function getAdminDisputes(token?: string): Promise<GetDisputesResponse> {
  const disputes = await request<GetDisputesResponse>("/disputes?status=OPEN,UNDER_REVIEW", {}, token, (value): value is GetDisputesResponse =>
    Array.isArray(value) && value.every(isDispute)
  );
  return disputes.filter((dispute) => dispute.status === "OPEN" || dispute.status === "UNDER_REVIEW");
}

/**
 * Resolves an active dispute as admin by either releasing funds to vendor or refunding buyer.
 *
 * @param id - The dispute ID.
 * @param resolution - The resolution action ("RELEASE_TO_VENDOR" or "REFUND_BUYER").
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to the resolution response.
 */
export async function resolveDispute(id: string, resolution: "RELEASE_TO_VENDOR" | "REFUND_BUYER", token?: string): Promise<ResolveDisputeResponse> {
  return request<ResolveDisputeResponse>(`/disputes/${id}/resolve`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resolution }),
  }, token, isDispute);
}

/**
 * Creates a dispute for an existing escrow.
 *
 * @param escrowId - The escrow ID.
 * @param data - Dispute reason, description, and evidence array.
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to the created dispute details.
 */
export async function createDispute(escrowId: string, data: CreateDisputeInput, token?: string): Promise<CreateDisputeResponse> {
  return request<CreateDisputeResponse>(`/escrows/${escrowId}/dispute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }, token, isDispute);
}

/**
 * Marks an escrow item as shipped with tracking information.
 *
 * @param escrowId - The escrow ID.
 * @param data - Tracking ID and optional carrier.
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to ship escrow response.
 */
export async function shipEscrow(escrowId: string, data: ShipEscrowInput, token?: string): Promise<ShipEscrowResponse> {
  return request<ShipEscrowResponse>(`/escrows/${escrowId}/ship`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }, token, isTracking);
}

/**
 * Fetches tracking information for a given escrow.
 *
 * @param escrowId - The escrow ID.
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to tracking details.
 */
export async function getTracking(escrowId: string, token?: string): Promise<GetTrackingResponse> {
  return request<GetTrackingResponse>(`/escrows/${escrowId}/tracking`, {}, token, isTracking);
}

/**
 * Fetches current subscription details for the authenticated user/vendor.
 *
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to subscription response.
 */
export async function getSubscription(token?: string): Promise<GetSubscriptionResponse> {
  return request<GetSubscriptionResponse>("/subscription", {}, token, isSubscription);
}

/**
 * Upgrades the user's subscription level.
 *
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to upgrade response.
 */
export async function upgradeSubscription(token?: string): Promise<UpgradeSubscriptionResponse> {
  return request<UpgradeSubscriptionResponse>("/subscription/upgrade", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }, token, isSubscription);
}

/**
 * Fetches vendor notification preferences.
 *
 * @param token - Required Bearer auth token.
 * @returns Promise resolving to vendor notification preferences.
 */
export async function getVendorNotificationPreferences(token: string): Promise<GetVendorNotificationPreferencesResponse> {
  return request<GetVendorNotificationPreferencesResponse>("/vendor/notifications", {}, token);
}

/**
 * Updates vendor notification preferences.
 *
 * @param prefs - Updated notification preference flags.
 * @param token - Required Bearer auth token.
 * @returns Promise resolving to empty response upon success.
 */
export async function patchVendorNotifications(prefs: VendorNotificationPreferences, token: string): Promise<EmptyResponse> {
  await request<EmptyResponse>("/vendor/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prefs),
  }, token);
}

/**
 * Cancels an unfunded escrow.
 *
 * @param escrowId - The escrow ID to cancel.
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to cancellation response.
 */
export async function cancelEscrow(escrowId: string, token?: string): Promise<CancelEscrowResponse> {
  return request<CancelEscrowResponse>(`/escrow/${escrowId}`, {
    method: "DELETE",
  }, token);
}

/**
 * Updates buyer contact information (email/phone) and email receipt preference.
 *
 * @param escrowId - The escrow ID.
 * @param data - Contact information and email receipt opt-in flag.
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to empty response upon success.
 */
export async function patchBuyerContact(
  escrowId: string,
  data: { email?: string; phone?: string; emailReceipt?: boolean },
  token?: string
): Promise<EmptyResponse> {
  await request<EmptyResponse>(`/escrow/${escrowId}/buyer-contact`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }, token);
}

/**
 * Fetches vendor analytics data points and statistics.
 *
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to vendor analytics payload.
 */
export async function getVendorAnalytics(token?: string): Promise<GetVendorAnalyticsResponse> {
  const response = await request<GetVendorAnalyticsApiResponse>("/vendor/analytics", {}, token);
  return normalizeVendorAnalyticsResponse(response);
}

/**
 * Fetches a vendor's public profile. Deliberately unauthenticated — the
 * `/vendor/[id]` page is publicly accessible.
 *
 * @param vendorId - The vendor's public address.
 * @returns Promise resolving to the vendor's public profile.
 */
export async function getVendorProfile(vendorId: string): Promise<GetVendorProfileResponse> {
  return request<GetVendorProfileResponse>(`/vendor/${encodeURIComponent(vendorId)}/profile`);
}

/**
 * Fetches the escrow links a vendor has published publicly. Unauthenticated,
 * for the same reason as {@link getVendorProfile}.
 *
 * @param vendorId - The vendor's public address.
 * @returns Promise resolving to the vendor's public escrows.
 */
export async function getPublicVendorEscrows(
  vendorId: string
): Promise<GetPublicVendorEscrowsResponse> {
  return request<GetPublicVendorEscrowsResponse>(`/vendor/${encodeURIComponent(vendorId)}/escrows`, {}, undefined, (value): value is GetPublicVendorEscrowsResponse =>
    Array.isArray(value) && value.every(isEscrow)
  );
}

/**
 * Return type of {@link createApiClient}. Each method is a thin wrapper around
 * the corresponding standalone API function, pre-bound to the supplied token.
 */
export interface ApiClient {
  createEscrow: (data: EscrowInput) => Promise<CreateEscrowResponse>;
  getEscrow: (id: string) => Promise<GetEscrowResponse>;
  getVendorEscrows: () => Promise<GetVendorEscrowsResponse>;
  getDispute: (id: string) => Promise<GetDisputeResponse>;
  getAdminDisputes: () => Promise<GetDisputesResponse>;
  resolveDispute: (
    id: string,
    resolution: "RELEASE_TO_VENDOR" | "REFUND_BUYER"
  ) => Promise<ResolveDisputeResponse>;
  createDispute: (
    escrowId: string,
    data: CreateDisputeInput
  ) => Promise<CreateDisputeResponse>;
  shipEscrow: (
    escrowId: string,
    data: ShipEscrowInput
  ) => Promise<ShipEscrowResponse>;
  cancelEscrow: (escrowId: string) => Promise<CancelEscrowResponse>;
  getTracking: (escrowId: string) => Promise<GetTrackingResponse>;
  getSubscription: () => Promise<GetSubscriptionResponse>;
  upgradeSubscription: () => Promise<UpgradeSubscriptionResponse>;
  getVendorNotificationPreferences: (
    authToken?: string
  ) => Promise<GetVendorNotificationPreferencesResponse>;
  patchVendorNotifications: (
    prefs: VendorNotificationPreferences,
    authToken?: string
  ) => Promise<EmptyResponse>;
  patchBuyerContact: (
    escrowId: string,
    data: { email?: string; phone?: string; emailReceipt?: boolean }
  ) => Promise<EmptyResponse>;
  getVendorAnalytics: () => Promise<GetVendorAnalyticsResponse>;
  getVendorProfile: (vendorId: string) => Promise<GetVendorProfileResponse>;
  getPublicVendorEscrows: (vendorId: string) => Promise<GetPublicVendorEscrowsResponse>;
}

export function createApiClient(token?: string): ApiClient {
  return {
    createEscrow: (data: EscrowInput) => createEscrow(data, token),
    getEscrow: (id: string) => getEscrow(id, token),
    getVendorEscrows: () => getVendorEscrows(token),
    getDispute: (id: string) => getDispute(id, token),
    getAdminDisputes: () => getAdminDisputes(token),
    resolveDispute: (id: string, resolution: "RELEASE_TO_VENDOR" | "REFUND_BUYER") => resolveDispute(id, resolution, token),
    createDispute: (escrowId: string, data: CreateDisputeInput) => createDispute(escrowId, data, token),
    shipEscrow: (escrowId: string, data: ShipEscrowInput) => shipEscrow(escrowId, data, token),
    cancelEscrow: (escrowId: string) => cancelEscrow(escrowId, token),
    getTracking: (escrowId: string) => getTracking(escrowId, token),
    getSubscription: () => getSubscription(token),
    upgradeSubscription: () => upgradeSubscription(token),
    getVendorNotificationPreferences: (authToken = token ?? "") => getVendorNotificationPreferences(authToken),
    patchVendorNotifications: (prefs: VendorNotificationPreferences, authToken = token ?? "") => patchVendorNotifications(prefs, authToken),
    patchBuyerContact: (escrowId: string, data: { email?: string; phone?: string; emailReceipt?: boolean }) => patchBuyerContact(escrowId, data, token),
    getVendorAnalytics: () => getVendorAnalytics(token),
    getVendorProfile: (vendorId: string) => getVendorProfile(vendorId),
    getPublicVendorEscrows: (vendorId: string) => getPublicVendorEscrows(vendorId),
  };
}
