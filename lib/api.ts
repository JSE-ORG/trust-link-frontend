import { apiRequest } from './api/client';
import { SESSION_KEY } from './auth/constants';

import { handleSessionExpired } from "@/hooks/useWallet";
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
/* eslint-disable @typescript-eslint/no-explicit-any -- generic wrapper preserves caller signatures */
function withSessionExpiryHandling<T extends (...args: any[]) => Promise<any>>(fn: T): T {
   
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        handleSessionExpired();
      }
      throw error;
    }
  }) as T;
export async function fetchProtectedData() {
  return apiRequest({ url: '/protected', method: 'GET' });
}

export function clearAuth(): void {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
}
