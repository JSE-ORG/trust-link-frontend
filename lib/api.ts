/**
 * API client — consolidated wrapper around lib/api/client.ts
 *
 * All implementation lives in lib/api/client.ts (typed, ApiError class,
 * centralized request helper). This module re-exports every public binding
 * so existing imports from "@/lib/api" keep working.
 *
 * The following type-only bindings are re-exported from @/types to avoid
 * duplication (they were historically defined inline in this file):
 *   - VendorNotificationPreferences
 *   - VendorAnalyticsPoint
 *   - VendorAnalyticsResponse
 */

import {
  type ApiClient,
  ApiError,
  type ApiErrorShape,
  cancelEscrow as cancelEscrowRaw,
  createApiClient as createApiClientRaw,
  createDispute as createDisputeRaw,
  type CreateDisputeInput,
  createEscrow as createEscrowRaw,
  type EscrowInput,
  type EscrowResponse,
  getAdminDisputes as getAdminDisputesRaw,
  getDispute as getDisputeRaw,
  getEscrow as getEscrowRaw,
  getPublicVendorEscrows as getPublicVendorEscrowsRaw,
  getSubscription as getSubscriptionRaw,
  getTracking as getTrackingRaw,
  getVendorAnalytics as getVendorAnalyticsRaw,
  getVendorEscrows as getVendorEscrowsRaw,
  getVendorNotificationPreferences as getVendorNotificationPreferencesRaw,
  getVendorProfile as getVendorProfileRaw,
  patchBuyerContact as patchBuyerContactRaw,
  patchVendorNotifications as patchVendorNotificationsRaw,
  resolveDispute as resolveDisputeRaw,
  shipEscrow as shipEscrowRaw,
  type ShipEscrowInput,
  upgradeSubscription as upgradeSubscriptionRaw,
} from "@/lib/api/client";

// Re-export types that were historically defined here but now live in @/types
export type {
  VendorAnalyticsApiResponse,
  VendorAnalyticsPoint,
  VendorAnalyticsResponse,
  VendorNotificationPreferences,
} from "@/types";

export interface BuyerContactInput {
  email?: string;
  phone?: string;
}

export { ApiError };
export type { ApiClient, ApiErrorShape, CreateDisputeInput, EscrowInput, EscrowResponse, ShipEscrowInput };

/**
 * Wraps an API call so that 401 responses are handled gracefully:
 * - clears the expired JWT from localStorage
 * - redirects the user to reconnect their wallet
 *
 * @param fn the API function to wrap
 * @returns the wrapped function with identical signature
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function withSessionExpiryHandling<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        // Only manipulate the browser environment if available
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("wallet.jwk");
          // Direct the user to reconnect their wallet
          window.location.assign("/wallet/reconnect?reason=session_expired");
        }
      }
      throw error;
    }
  }) as T;
}

// Wrap each individual API function
export const cancelEscrow = withSessionExpiryHandling(cancelEscrowRaw);
export const createDispute = withSessionExpiryHandling(createDisputeRaw);
export const createEscrow = withSessionExpiryHandling(createEscrowRaw);
export const getAdminDisputes = withSessionExpiryHandling(getAdminDisputesRaw);
export const getDispute = withSessionExpiryHandling(getDisputeRaw);
export const getEscrow = withSessionExpiryHandling(getEscrowRaw);
export const getPublicVendorEscrows = withSessionExpiryHandling(getPublicVendorEscrowsRaw);
export const getSubscription = withSessionExpiryHandling(getSubscriptionRaw);
export const getTracking = withSessionExpiryHandling(getTrackingRaw);
export const getVendorAnalytics = withSessionExpiryHandling(getVendorAnalyticsRaw);
export const getVendorEscrows = withSessionExpiryHandling(getVendorEscrowsRaw);
export const getVendorNotificationPreferences = withSessionExpiryHandling(getVendorNotificationPreferencesRaw);
export const getVendorProfile = withSessionExpiryHandlinn(getVendorProfileRaw);
export const patchBuyerContact = withSessionExpiryHandling(patchBuyerContactRaw);
export const patchVendorNotifications = withSessionExpiryHandling(patchVendorNotificationsRaw);
export const resolveDispute = withSessionExpiryHandling(resolveDisputeRaw);
export const shipEscrow = withSessionExpiryHandling(shipEscrowRaw);
export const upgradeSubscription = withSessionExpiryHandling(upgradeSubscriptionRaw);

/**
 * Creates a new API client and wraps all of its methods with
 * session-expiry handling.
 */
export function createApiClient(...args: Parameters<typeof createApiClientRaw>): ApiClient {
  const client = createApiClientRaw(...args);
  const wrappedClient = { ...client } as ApiClient & Record<string, unknown>;
  for (const key of Object.keys(wrappedClient)) {
    const value = wrappedClient[key];
    if (typeof value === "function") {
      wrappedClient[key] = withSessionExpiryHandling(value as never);
    }
  }
  return wrappedClient;
}
