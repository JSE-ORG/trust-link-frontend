import type { Meta, StoryObj } from "@storybook/react";
import ConfirmationDialog from "./ConfirmationDialog";

const meta: Meta<typeof ConfirmationDialog> = {
  title: "UI/ConfirmationDialog",
  component: ConfirmationDialog,
  args: {
    open: true,
    title: "Cancel this escrow?",
    description: "The buyer will be refunded and this link will stop working.",
    onConfirm: () => {},
    onCancel: () => {},
  },
};

export default meta;

export const Default: StoryObj<typeof ConfirmationDialog> = {};

export const Danger: StoryObj<typeof ConfirmationDialog> = {
  args: {
    variant: "danger",
    confirmLabel: "Yes, cancel escrow",
    cancelLabel: "Keep escrow",
  },
};

export const Loading: StoryObj<typeof ConfirmationDialog> = {
  args: {
    loading: true,
  },
};
