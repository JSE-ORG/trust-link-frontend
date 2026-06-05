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
