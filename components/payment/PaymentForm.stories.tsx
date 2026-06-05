import type { Meta, StoryObj } from "@storybook/react";
import PaymentForm from "./PaymentForm";

const meta: Meta<typeof PaymentForm> = {
  title: "Payment/PaymentForm",
  component: PaymentForm,
  parameters: {
    layout: "centered",
  },
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900 p-8">
        <div className="max-w-md mx-auto">
          <Story />
        </div>
      </div>
    ),
  ],
};

export default meta;

type Story = StoryObj<typeof PaymentForm>;

// Default props for stories
const defaultArgs = {
  escrowId: "escrow-12345",
  itemName: "Premium Widget",
  amount: 100,
  protocolFee: 2.5,
  total: 102.5,
  sellerAddress: "GSELLER1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  escrowContractId: "CONTRACT1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  status: "PENDING",
  onPaymentSuccess: (txHash: string) => console.log("Payment success:", txHash),
};

/**
 * Default state with wallet connected - ready to pay
 */
export const Default: Story = {
  args: {
    ...defaultArgs,
  },
};

/**
 * Wallet disconnected state - user needs to connect wallet first
 */
export const WalletDisconnected: Story = {
  args: {
    ...defaultArgs,
  },
  parameters: {
    // In a real scenario, this would be controlled by the wallet hook
    // For Storybook, we document this state
  },
};

/**
 * Loading state - payment is being processed
 */
export const Loading: Story = {
  args: {
    ...defaultArgs,
  },
  parameters: {
    // Simulates the loading state during payment processing
  },
};

/**
 * Success state - payment completed successfully
 */
export const Success: Story = {
  args: {
    ...defaultArgs,
  },
  parameters: {
    // Shows the success state with transaction hash
  },
};

/**
 * Error state - payment failed with error message
 */
export const Error: Story = {
  args: {
    ...defaultArgs,
  },
  parameters: {
    // Shows error state with error message
  },
};

/**
 * Escrow not payable - when escrow status is not PENDING or Active
 */
export const EscrowNotPayable: Story = {
  args: {
    ...defaultArgs,
    status: "COMPLETED",
  },
};

/**
 * Different amounts - showcasing various payment amounts
 */
export const LargeAmount: Story = {
  args: {
    ...defaultArgs,
    itemName: "Enterprise License",
    amount: 5000,
    protocolFee: 125,
    total: 5125,
  },
};

/**
 * Small amount - showcasing micro payments
 */
export const SmallAmount: Story = {
  args: {
    ...defaultArgs,
    itemName: "Digital Asset",
    amount: 0.5,
    protocolFee: 0.01,
    total: 0.51,
  },
};