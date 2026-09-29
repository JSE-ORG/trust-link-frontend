import type { DisputeStatus,EscrowStatus } from "./status";
export type { DisputeStatus,EscrowStatus };
export { DisputeStatus as DisputeStatusConst,EscrowStatus as EscrowStatusConst } from "./status";

export interface FetchHookResult<T> {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
}

export interface Escrow {
  id: string;
  vendorId: string;
  buyerId?: string;
  amount: number;
  item: string;
  description?: string; // Markdown-formatted item description
  contractAddress?: string;
  status: EscrowStatus;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string;
  history: EscrowHistoryEvent[];
  imageUrl?: string; // Optional escrow item image for display
}

export interface EscrowHistoryEvent {
  id: string;
  escrowId: string;
  status: EscrowStatus;
  timestamp: string;
  description: string;
}

export interface Dispute {
  id: string;
  escrowId: string;
  escrow: Escrow;
  buyerId: string;
  reason: string;
  description?: string; // Free-text detail submitted with the dispute
  evidence: string[]; // URLs to evidence
  status: DisputeStatus;
  resolution?: 'RELEASE_TO_VENDOR' | 'REFUND_BUYER';
  createdAt: string;
  updatedAt: string;
}

export interface TrackingEvent {
  id: string;
  status: string;
  location: string;
  timestamp: string;
  description: string;
}

export interface Tracking {
  escrowId: string;
  status: string;
  carrier: string;
  trackingNumber: string;
  estimatedDelivery?: string;
  events: TrackingEvent[];
}

export interface AppNotification {
  id: string;
  escrowId: string;
  escrowItem: string;
  type: EscrowStatus;
  message: string;
  timestamp: string;
  read: boolean;
}

export type Plan = "FREE" | "PRO";

export interface Subscription {
  plan: Plan;
  vendorId: string;
  upgradedAt?: string;
  expiresAt?: string;
}

/**
 * Public-facing vendor profile, populated from the data the onboarding wizard
 * collects. Everything but `id` and `shopName` is optional because a vendor can
 * finish onboarding with only the required fields filled in.
 */
export interface VendorProfile {
  /** Vendor's Stellar address — the `/vendor/[id]` route segment. */
  id: string;
  shopName: string;
  description?: string;
  website?: string;
  /**
   * Shipping destinations. The wizard collects a comma-separated string, so the
   * API may hand back either form; use `parseShippingLocations` to normalise.
   */
  shippingLocations?: string[] | string;
  joinedAt?: string;
  rating?: number;
  reviewsCount?: number;
  verificationLevel?: string;
  totalTransactions?: number;
  successfulEscrows?: number;
  disputeRate?: number;
}

export interface VendorNotificationPreferences {
  funded: { email: boolean; sms: boolean };
  shipped: { email: boolean; sms: boolean };
  delivered: { email: boolean; sms: boolean };
  disputed: { email: boolean; sms: boolean };
  completed: { email: boolean; sms: boolean };
}

export interface VendorAnalyticsPoint {
  date: string;
  transactionVolume: number;
  averageOrderValue: number;
  completionRate: number;
  disputeRate: number;
}

export interface VendorAnalyticsResponse {
  totalTransactionVolume?: number;
  averageOrderValue?: number;
  completionRate?: number;
  disputeRate?: number;
  periodLabel?: string;
  generatedAt?: string;
  /** Normalized chart points for all supported API response variants. */
  dataPoints: VendorAnalyticsPoint[];
}

/** The vendor analytics shapes returned by different API versions. */
export interface VendorAnalyticsApiResponse extends Omit<VendorAnalyticsResponse, "dataPoints"> {
  dailyMetrics?: VendorAnalyticsPoint[];
  series?: VendorAnalyticsPoint[];
  data?: VendorAnalyticsPoint[];
}
