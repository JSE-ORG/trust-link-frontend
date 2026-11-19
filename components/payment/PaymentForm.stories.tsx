import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";
import React from "react";

import { NetworkProvider } from "@/components/providers/NetworkProvider";

import { MockWalletProvider } from "../../.storybook/mock-wallet";
import PaymentForm from "./PaymentForm";

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
    (Story: () => React.ReactNode, context) => (
      <NetworkProvider>
        <MockWalletProvider {...context.parameters?.wallet}>
          <div className="min-h-screen bg-zinc-100 dark:bg-zinc-900 p-8">
            <div className="max-w-md mx-auto">
              <Story />
            </div>
          </div>
        </MockWalletProvider>
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
  sellerAddress: "GSELLER1234567890ABCDEFGHIJKLMNOPQRSTUWXYZ",
  escrowContractId: "CONTRACT1234567890ABCDEFGHIJKLMNOPQRSTUWWXYZZ",
  status: "PENDING",
  onPaymentSuccess: fn(),
};

/**
 * Idle state — form ready, wallet connected.
 *
 * Renders with a mock connected wallet. The CTA reads "Pay with Freighter"
 * and is enabled without requiring an actual browser extension.
 */
export const Idle: Story = {
  name: "Idle — form ready, wallet connected",
  args: { ...defaultArgs },
  parameters: {
    wallet: { status: "connected" },
    docs: {
      description: {
        story:
          "Form is ready for payment. Rendered with an isolated mock wallet fixture, " +
          "the CTA reads \"Pay with Freighter\" and is fully enabled without contacting extension services.",
      },
    },
  },
};

/**
 * Wallet not connected — shows the connect-wallet prompt.
 * Rendered using a disconnected mock wallet fixture.
 */
export const WalletNotConnected: Story = {
  name: "Wallet Not Connected — connect-wallet prompt",
  args: { ...defaultArgs, previewWalletDisconnected: true },
  parameters: {
    wallet: { status: "disconnected" },
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
 */
export const Submitting: Story = {
  name: "Submitting — CTA loading state",
  args: { ...defaultArgs, previewFormState: "loading" },
  parameters: {
    wallet: { status: "connected" },
    docs: {
      description: {
        story:
          "While the transaction is in-flight the CTA shows a spinner " +
          "and the label changes to \"Processing payment…\".",
      },
    },
  },
};

/**
 * Error — transaction rejected by the wallet or network.
 */
export const Error: Story = {
  name: "Error — Horizon transaction rejected",
  args: {
    ...defaultArgs,
    previewFormState: "error",
    previewErrorMessage: "Transaction was rejected in wallet",
  },
  parameters: {
    wallet: { status: "connected" },
    docs: {
      description: {
        story:
          "When transaction signing or submission fails, an error banner appears: " +
          "\"Transaction was rejected in wallet\".",
      },
    },
  },
};

/**
 * Success — payment completed with transaction hash.
 */
export const Success: Story = {
  name: "Success — payment completed with hash",
  args: {
    ...defaultArgs,
    previewFormState: "success",
    previewTxHash: "3f7a91bc901234567890abcdef",
  },
  parameters: {
    wallet: { status: "connected" },
    docs: {
      description: {
        story:
          "When the transaction succeeds, the form shows a success banner " +
          "with the transaction hash and a confirmation message.",
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
    wallet: { status: "connected" },
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
  parameters: {
    wallet: { status: "connected" },
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
  parameters: {
    wallet: { status: "connected" },
  },
};
