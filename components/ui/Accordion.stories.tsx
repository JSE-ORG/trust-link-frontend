import { Meta, StoryObj } from "@storybook/react";
import { Star } from "lucide-react";
import React from "react";

import { Accordion } from "./Accordion";

const meta: Meta<typeof Accordion> = {
  title: "UI/Accordion",
  component: Accordion,
  argTypes: {
    items: { control: "object" },
    className: { control: "text" },
  },
};

export default meta;

type Story = StoryObj<typeof Accordion>;

export const Default: Story = {
  args: {
    items: [
      {
        question: "What is Trust Link?",
        answer: "Trust Link is a sample escrow and payments UI used in the app.",
        icon: <Star />,
      },
      {
        question: "How does it work?",
        answer: "Users create escrows, deposit funds and release on completion.",
      },
    ],
  },
};

export const WithDisabledItem: Story = {
  args: {
    items: [
      { question: "Enabled item", answer: "This can be toggled." },
      { question: "Disabled item", answer: "Cannot be toggled.", disabled: true },
    ],
  },
};
import type { Meta, StoryObj } from "@storybook/react";
import { HelpCircle, ShieldCheck, Truck } from "lucide-react";

import { Accordion } from "./Accordion";

const meta: Meta<typeof Accordion> = {
  title: "UI/Accordion",
  component: Accordion,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Collapsible question/answer list. Only one item can be open at a time. " +
          "Items can optionally carry a leading icon or be marked `disabled` to prevent expansion.",
      },
    },
  },
  argTypes: {
    items: {
      control: "object",
      description:
        "Array of `{ question, answer, icon?, disabled? }` entries rendered as accordion rows.",
    },
    className: {
      control: "text",
      description: "Additional CSS classes applied to the wrapping container.",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Accordion>;

/**
 * Default state — a plain FAQ-style list with no icons or disabled items.
 */
export const Default: Story = {
  args: {
    items: [
      {
        question: "How does escrow protect my payment?",
        answer:
          "Funds are held on-chain until the buyer confirms delivery, at which point they're released to the vendor.",
      },
      {
        question: "What happens if there's a dispute?",
        answer:
          "Either party can open a dispute before release, which pauses the payout until it's resolved.",
      },
      {
        question: "How long does a payout take?",
        answer:
          "Once released, funds typically arrive in the vendor's wallet within a few seconds on Stellar.",
      },
    ],
  },
};

/**
 * Each item carries a leading icon, useful for grouping topics visually.
 */
export const WithIcons: Story = {
  args: {
    items: [
      {
        question: "Is my payment protected?",
        answer:
          "Yes — funds are locked in escrow and only released once the buyer confirms delivery.",
        icon: <ShieldCheck className="h-4 w-4" />,
      },
      {
        question: "How is my order shipped?",
        answer:
          "The vendor uploads tracking details once the item ships, visible on your tracking page.",
        icon: <Truck className="h-4 w-4" />,
      },
      {
        question: "Where can I get more help?",
        answer: "Reach out to support from the dashboard and we'll get back within a day.",
        icon: <HelpCircle className="h-4 w-4" />,
      },
    ],
  },
};

/**
 * A disabled item is visually muted, cannot be expanded, and is skipped by
 * keyboard toggling — useful for items that are coming soon or conditionally
 * unavailable.
 */
export const WithDisabledItem: Story = {
  args: {
    items: [
      {
        question: "How does escrow protect my payment?",
        answer:
          "Funds are held on-chain until the buyer confirms delivery, at which point they're released to the vendor.",
      },
      {
        question: "Multi-currency support (coming soon)",
        answer: "This section will be available once multi-currency escrow ships.",
        disabled: true,
      },
      {
        question: "How long does a payout take?",
        answer:
          "Once released, funds typically arrive in the vendor's wallet within a few seconds on Stellar.",
      },
    ],
  },
};

/**
 * A single-item accordion, e.g. for an inline "details" disclosure.
 */
export const SingleItem: Story = {
  args: {
    items: [
      {
        question: "What is TrustLink?",
        answer:
          "TrustLink is a Stellar-based escrow platform that lets vendors and buyers transact safely without a middleman.",
      },
    ],
  },
};