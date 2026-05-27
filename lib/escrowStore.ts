export type EscrowItem = {
  escrowId: string;
  vendor: string;
  orders: number;
  status: string;
  trackingId?: string;
  carrier?: string;
};

const escrowItems: EscrowItem[] = [
  {
    escrowId: "escrow-1",
    vendor: "Alliance Logistics",
    orders: 24,
    status: "Ready",
  },
  {
    escrowId: "escrow-2",
    vendor: "Prime Supplies",
    orders: 18,
    status: "Pending",
  },
  {
    escrowId: "escrow-3",
    vendor: "Blue Harbor",
    orders: 12,
    status: "Confirmed",
  },
];

export function getEscrowItems() {
  return escrowItems;
}

export function shipEscrow(escrowId: string, trackingId: string, carrier: string) {
  const item = escrowItems.find((entry) => entry.escrowId === escrowId);
  if (!item) {
    throw new Error("Escrow item not found.");
  }

  item.trackingId = trackingId;
  item.carrier = carrier;
  item.status = "Shipped";
  return item;
}
