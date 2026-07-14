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

// Re-export every function + interface from the canonical client
export {
  // client class & helpers
  ApiError,
  createApiClient,

  // functions
  createEscrow,
  getEscrow,
  getVendorEscrows,
  getDispute,
  getAdminDisputes,
  resolveDispute,
  createDispute,
  shipEscrow,
  getTracking,
  getSubscription,
  upgradeSubscription,
  getVendorNotificationPreferences,
  patchVendorNotifications,
  patchBuyerContact,
  getVendorAnalytics,

  // input / response interfaces
  type EscrowInput,
  type EscrowResponse,
  type CreateDisputeInput,
  type ShipEscrowInput,
  type ApiErrorShape,
} from "@/lib/api/client";

// Re-export types that were historically defined here but now live in @/types
export type { VendorNotificationPreferences, VendorAnalyticsPoint, VendorAnalyticsResponse } from "@/types";

/**
 * BuyerContactInput — kept for backward-compatibility.
 * The canonical client uses an inline `{ email?: string; phone?: string }`.
 */
export interface BuyerContactInput {
  email?: string;
  phone?: string;
}
