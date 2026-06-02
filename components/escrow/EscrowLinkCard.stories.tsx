import type { Meta, StoryObj } from "@storybook/react";
import EscrowLinkCard from "./EscrowLinkCard";

const meta: Meta<typeof EscrowLinkCard> = {
  title: "Escrow/EscrowLinkCard",
  component: EscrowLinkCard,
};

export default meta;

export const Default: StoryObj<typeof EscrowLinkCard> = {
  args: {
    loading: false,
  },
};

export const Loading: StoryObj<typeof EscrowLinkCard> = {
  args: {
    loading: true,
  },
};
