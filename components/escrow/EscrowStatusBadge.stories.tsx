import type { Meta, StoryObj } from "@storybook/react";
import { EscrowStatusBadge } from "./EscrowStatusBadge";

const meta: Meta<typeof EscrowStatusBadge> = {
  title: "Escrow/EscrowStatusBadge",
  component: EscrowStatusBadge,
  tags: ["autodocs"],
  argTypes: {
    status: {
      control: "text",
      description: "The escrow status string (case-insensitive)",
    },
    className: {
      control: "text",
      description: "Additional CSS classes",
    },
  },
};

export default meta;

export const Pending: StoryObj<typeof EscrowStatusBadge> = {
  args: {
    status: "Pending",
  },
};

export const Funded: StoryObj<typeof EscrowStatusBadge> = {
  args: {
    status: "Funded",
  },
};

export const Shipped: StoryObj<typeof EscrowStatusBadge> = {
  args: {
    status: "Shipped",
  },
};

export const Completed: StoryObj<typeof EscrowStatusBadge> = {
  args: {
    status: "Completed",
  },
};

export const Disputed: StoryObj<typeof EscrowStatusBadge> = {
  args: {
    status: "Disputed",
  },
};

export const Refunded: StoryObj<typeof EscrowStatusBadge> = {
  args: {
    status: "Refunded",
  },
};

export const Cancelled: StoryObj<typeof EscrowStatusBadge> = {
  args: {
    status: "Cancelled",
  },
};

export const CaseInsensitive: StoryObj<typeof EscrowStatusBadge> = {
  args: {
    status: "FUNDED",
  },
};

export const UnknownStatus: StoryObj<typeof EscrowStatusBadge> = {
  args: {
    status: "InReview",
  },
};
