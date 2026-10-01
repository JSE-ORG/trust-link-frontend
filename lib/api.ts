/**
 * API barrel — the only import path components and hooks should use.
 *
 * All implementation lives in `lib/api/client.ts` (typed, `ApiError` class,
 * centralized request helper). This module re-exports every public binding so
 * existing imports from `@/lib/api` keep working.
 *
 * The following type-only bindings are re-exported from `@/types` to avoid
 * duplication (they were historically defined inline in this file):
 *   - VendorNotificationPreferences
 *   - VendorAnalyticsPoint
 *   - VendorAnalyticsResponse
 */

// Re-export every function + interface from the canonical client
export {
  type ApiClient,
  // client class & helpers
  ApiConfigurationError,
  ApiError,
  type ApiErrorShape,
  ApiNetworkError,
  cancelEscrow,
  confirmDelivery,
  createDispute,
  type CreateDisputeInput,
  // functions
  createEscrow,
  // input / response interfaces
  type EscrowInput,
  type EscrowResponse,
  getAdminDisputes,
  getDispute,
  getEscrow,
  getPublicVendorEscrows,
  getSubscription,
  getTracking,
  getVendorAnalytics,
  getVendorEscrows,
  getVendorNotificationPreferences,
  getVendorProfile,
  normalizeVendorAnalyticsResponse,
  patchBuyerContact,
  patchVendorNotifications,
  resolveDispute,
  shipEscrow,
  type ShipEscrowInput,
  upgradeSubscription,
} from "@/lib/api/client";

// Re-export types that were historically defined here but now live in @/types
export type {
  VendorAnalyticsApiResponse,
  VendorAnalyticsPoint,
  VendorAnalyticsResponse,
  VendorNotificationPreferences,
} from "@/types";

/**
 * BuyerContactInput — kept for backward-compatibility.
 * The canonical client uses an inline `{ email?: string; phone?: string }`.
 */
export interface BuyerContactInput {
  email?: string;
  phone?: string;
}