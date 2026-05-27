export type EscrowStatus = 'PENDING' | 'FUNDED' | 'SHIPPED' | 'COMPLETED' | 'DISPUTED' | 'RELEASED' | 'REFUNDED';

export interface Escrow {
  id: string;
  vendorId: string;
  buyerId?: string;
  amount: number;
  item: string;
  status: EscrowStatus;
  createdAt: string;
  updatedAt: string;
  history: EscrowHistoryEvent[];
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
  status: 'OPEN' | 'RESOLVED';
  resolution?: 'RELEASE_TO_VENDOR' | 'REFUND_BUYER';
  createdAt: string;
  updatedAt: string;
}
