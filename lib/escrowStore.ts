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

/**
 * Retrieves the current list of mock escrow items.
 * @returns Array of escrow items.
 */
export function getEscrowItems(): EscrowItem[] {
  return escrowItems;
}

/**
 * Updates an escrow item's status to "Shipped" and attaches tracking info.
 *
 * @param escrowId - The unique identifier of the escrow item.
 * @param trackingId - The shipment tracking identifier.
 * @param carrier - The courier or carrier name.
 * @returns The updated EscrowItem object.
 * @throws {Error} If no escrow item with the specified ID is found.
 */
export function shipEscrow(
  escrowId: string,
  trackingId: string,
  carrier: string
): EscrowItem {
  const item = escrowItems.find((entry) => entry.escrowId === escrowId);
  if (!item) {
    throw new Error("Escrow item not found.");
  }

  item.trackingId = trackingId;
  item.carrier = carrier;
  item.status = "Shipped";
  return item;
}
