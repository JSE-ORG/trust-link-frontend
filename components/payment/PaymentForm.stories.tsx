import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import PaymentForm from "./PaymentForm";
import { NetworkProvider } from "@/components/providers/NetworkProvider";
import { WalletProvider } from "@/components/providers/WalletProvider";

const meta: Meta<typeof PaymentForm> = {
  title: "Payment/PaymentForm",
  component: PaymentForm,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Payment card for funding a Stellar escrow via Freighter. " +
          "Handles wallet connection detection, transaction signing, and success/error feedback.",
      },
    },
  },
  decorators: [
    (Story: () => React.ReactNode) => (
      <NetworkProvider>
        <WalletProvider>
          <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900 p-8">
            <div className="max-w-md mx-auto">
              <Story />
            </div>
          </div>
        </WalletProvider>
      </NetworkProvider>
    ),
  ],
  argTypes: {
    escrowId: { control: "text" },
    itemName: { control: "text" },
    amount: { control: "number" },
    protocolFee: { control: "number" },
    total: { control: "number" },
    sellerAddress: { control: "text" },
    escrowContractId: { control: "text" },
    status: {
      control: "select",
      options: ["PENDING", "Active", "COMPLETED", "EXPIRED"],
    },
    onPaymentSuccess: { action: "payment-success" },
  },
};

export default meta;
type Story = StoryObj<typeof PaymentForm>;

const defaultArgs = {
  escrowId: "escrow-12345",
  itemName: "Premium Widget",
  amount: 100,
  protocolFee: 2.5,
  total: 102.5,
  sellerAddress: "GSELLER1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  escrowContractId: "CONTRACT1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  status: "PENDING",
  onPaymentSuccess: fn(),
};

/**
 * Idle state — form ready, wallet connected.
 *
 * In this Storybook environment Freighter is not installed, so the form
 * renders in the "wallet not connected" visual state. In production, when
 * Freighter is installed and connected, the Pay button is fully enabled.
 */
export const Idle: Story = {
  name: "Idle — form ready, wallet connected",
  args: { ...defaultArgs },
  parameters: {
    docs: {
      description: {
        story:
          "Form is ready for payment. When Freighter is installed and the wallet is connected, " +
          "the CTA reads \"Pay with Freighter\" and is fully enabled.",
      },
    },
  },
};

/**
 * Wallet not connected — shows the connect-wallet prompt.
 * In Storybook (no Freighter installed) this is the default visual state.
 */
export const WalletNotConnected: Story = {
  name: "Wallet Not Connected — connect-wallet prompt",
  args: { ...defaultArgs },
  parameters: {
    docs: {
      description: {
        story:
          "When no wallet is connected, the form shows an amber prompt " +
          "\"Connect wallet to continue\" and the CTA button is disabled.",
      },
    },
  },
};

/**
 * Submitting — loading state while the transaction is being signed and broadcast.
 *
 * NOTE: This state requires Freighter to be installed and connected.
 * In Storybook the wallet is not available, so the button stays in its
 * disabled state. In production, clicking "Pay with Freighter" triggers
 * a spinner and "Processing payment…" label.
 */
export const Submitting: Story = {
  name: "Submitting — CTA loading state",
  args: { ...defaultArgs },
  parameters: {
    docs: {
      description: {
        story:
          "While the Freighter transaction is in-flight the CTA shows a spinner " +
          "and the label changes to \"Processing payment…\". " +
          "Requires a connected Freighter wallet to reach this state.",
      },
    },
  },
};

/**
 * Error — Horizon transaction rejected by the wallet or network.
 *
 * NOTE: Requires a connected Freighter wallet to trigger the error flow.
 * In production, rejecting the transaction in Freighter sets the error banner.
 */
export const Error: Story = {
  name: "Error — Horizon transaction rejected",
  args: { ...defaultArgs },
  parameters: {
    docs: {
      description: {
        story:
          "When Freighter rejects or the user cancels, an error banner appears: " +
          "\"Transaction was rejected in wallet\". The CTA returns to its idle label.",
      },
    },
  },
};

/**
 * Escrow not payable — status is neither PENDING nor Active.
 * The CTA is disabled and clicking it immediately shows an error.
 */
export const EscrowNotPayable: Story = {
  name: "Escrow Not Payable — wrong status",
  args: { ...defaultArgs, status: "COMPLETED" },
  parameters: {
    docs: {
      description: {
        story:
          "When `status` is anything other than `PENDING` or `Active`, " +
          "the payment attempt is blocked and an error is shown.",
      },
    },
  },
};

/**
 * Large amount — enterprise-scale payment.
 */
export const LargeAmount: Story = {
  name: "Large Amount — enterprise license",
  args: {
    ...defaultArgs,
    itemName: "Enterprise License",
    amount: 5000,
    protocolFee: 125,
    total: 5125,
  },
};

/**
 * Small amount — micro payment.
 */
export const SmallAmount: Story = {
  name: "Small Amount — digital asset",
  args: {
    ...defaultArgs,
    itemName: "Digital Asset",
    amount: 0.5,
    protocolFee: 0.01,
    total: 0.51,
  },
};
