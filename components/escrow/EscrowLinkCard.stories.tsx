import type { Meta, StoryObj } from "@storybook/react";
import EscrowLinkCard from "./EscrowLinkCard";

const meta: Meta<typeof EscrowLinkCard> = {
  title: "Escrow/EscrowLinkCard",
  component: EscrowLinkCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Displays a shareable escrow payment link with QR code, copy, and social-share actions. " +
          "The card fetches its own escrow data internally — pass `loading` to show the skeleton while data loads.",
      },
    },
  },
  argTypes: {
    loading: {
      control: "boolean",
      description: "Show the skeleton placeholder while escrow data is loading.",
      defaultValue: false,
    },
    onCopySuccess: { action: "copy-success" },
    onCopyError: { action: "copy-error" },
  },
};

export default meta;
type Story = StoryObj<typeof EscrowLinkCard>;

/**
 * Default active escrow — the link is live and the buyer can copy/share it.
 * This is the most common state after an escrow is created.
 */
export const Active: Story = {
  name: "Active — escrow with full link",
  args: {
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "An active escrow whose payment link is ready to share. " +
          "The card shows the escrow title, amount, status badge, copyable URL, and social-share buttons.",
      },
    },
  },
};

/**
 * Skeleton placeholder shown while the escrow data request is in-flight.
 */
export const Loading: Story = {
  name: "Loading — skeleton placeholder",
  args: {
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Renders an animated skeleton while the escrow link is being fetched from the API.",
      },
    },
  },
};

/**
 * Expired escrow — the `expiresAt` date has passed.
 * The card renders with `loading: false`; in production the fetched data would
 * carry `status: "Expired"`, showing the badge in a muted/error colour.
 *
 * NOTE: The component fetches its own data internally. In a production build
 * the API returns the current status, so this story represents the visual
 * state reviewers will see when an escrow has expired.
 */
export const Expired: Story = {
  name: "Expired — past expiresAt",
  args: {
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Represents an escrow whose `expiresAt` date has passed. " +
          "In this Storybook environment the internal fetch always returns `status: \"Active\"` " +
          "because the component owns its own data fetching. " +
          "In production the API returns `status: \"Expired\"` which updates the status badge.",
      },
    },
  },
};

/**
 * Pending payout — the shipment has been delivered but the vendor has not
 * yet released the escrow funds. The buyer has confirmed receipt.
 *
 * Same note as Expired: the component fetches its own data, so the status
 * badge in Storybook always shows `Active`. In production the API would
 * return `status: "Pending Payout"`.
 */
export const PendingPayout: Story = {
  name: "Pending Payout — awaiting vendor release",
  args: {
    loading: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Represents a delivered shipment where the buyer confirmed receipt but the vendor " +
          "hasn't released funds yet. In production the API returns `status: \"Pending Payout\"`.",
      },
    },
  },
};
