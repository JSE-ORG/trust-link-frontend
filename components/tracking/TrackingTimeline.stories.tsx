import type { Meta, StoryObj } from "@storybook/react";
import React from "react";

import { Escrow } from "@/types";

import TrackingTimeline from "./TrackingTimeline";

const meta: Meta<typeof TrackingTimeline> = {
  title: "Tracking/TrackingTimeline",
  component: TrackingTimeline,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story: () => React.ReactNode) => (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900 p-8">
        <div className="max-w-2xl mx-auto">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof TrackingTimeline>;

// Helper to create mock escrow with specific status
const createMockEscrow = (status: Escrow["status"]): Escrow => ({
  id: "esc_123456",
  vendorId: "vendor_001",
  buyerId: "buyer_001",
  amount: 150.0,
  item: "Wireless Headphones",
  status,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  history: [],
});

/**
 * Loading state - Shows skeleton placeholders while data is being fetched
 */
export const Loading: Story = {
  args: {
    escrowId: "esc_123456",
    initialEscrow: createMockEscrow("PENDING"),
    loading: true,
  },
};

/**
 * Order Placed (PENDING) - Initial state when order is created but not yet funded
 * Shows: Order placed stage highlighted, all other stages pending
 */
export const OrderPlaced: Story = {
  args: {
    escrowId: "esc_123456",
    initialEscrow: createMockEscrow("PENDING"),
  },
};

/**
 * Payment Confirmed (FUNDED) - Escrow is funded, awaiting shipment
 * Shows: Order placed and payment confirmed stages completed, shipping stages pending
 */
export const PaymentConfirmed: Story = {
  args: {
    escrowId: "esc_123456",
    initialEscrow: createMockEscrow("FUNDED"),
  },
};

/**
 * Shipped (SHIPPED) - Item has been shipped, awaiting delivery
 * Shows: First three stages completed, delivery and delivered pending
 * Action buttons: "Confirm Delivery" and "Raise Dispute" are visible
 */
export const Shipped: Story = {
  args: {
    escrowId: "esc_123456",
    initialEscrow: createMockEscrow("SHIPPED"),
  },
};

/**
 * Delivered (COMPLETED) - Item delivered and transaction completed
 * Shows: All stages completed with green checkmarks
 */
export const Delivered: Story = {
  args: {
    escrowId: "esc_123456",
    initialEscrow: createMockEscrow("COMPLETED"),
  },
};

/**
 * Disputed (DISPUTED) - Dispute has been raised
 * Shows: Yellow dispute notification banner
 */
export const Disputed: Story = {
  args: {
    escrowId: "esc_123456",
    initialEscrow: createMockEscrow("DISPUTED"),
  },
};

/**
 * Released (RELEASED) - Funds released to seller, transaction fully complete
 * Shows: All stages completed
 */
export const Released: Story = {
  args: {
    escrowId: "esc_123456",
    initialEscrow: createMockEscrow("RELEASED"),
  },
};