export type EscrowStatus = 'PENDING' | 'FUNDED' | 'SHIPPED' | 'COMPLETED' | 'DISPUTED' | 'RELEASED' | 'REFUNDED' | 'EXPIRED';

export interface Escrow {
  id: string;
  vendorId: string;
  buyerId?: string;
  amount: number;
  item: string;
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
  evidence: string[]; // URLs to evidence
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED';
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
  dailyMetrics?: VendorAnalyticsPoint[];
  series?: VendorAnalyticsPoint[];
  data?: VendorAnalyticsPoint[];
}
