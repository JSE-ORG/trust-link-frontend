export const EscrowStatus = {
  PENDING: "PENDING",
  FUNDED: "FUNDED",
  SHIPPED: "SHIPPED",
  COMPLETED: "COMPLETED",
  DISPUTED: "DISPUTED",
  RELEASED: "RELEASED",
  REFUNDED: "REFUNDED",
  EXPIRED: "EXPIRED",
} as const;

export type EscrowStatus = (typeof EscrowStatus)[keyof typeof EscrowStatus];

export const DisputeStatus = {
  OPEN: "OPEN",
  UNDER_REVIEW: "UNDER_REVIEW",
  RESOLVED: "RESOLVED",
} as const;

export type DisputeStatus = (typeof DisputeStatus)[keyof typeof DisputeStatus];
