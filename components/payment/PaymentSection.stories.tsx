import type { Meta, StoryObj } from "@storybook/react";
import PaymentSection from "./PaymentSection";

const meta: Meta<typeof PaymentSection> = {
  title: "Payment/PaymentSection",
  component: PaymentSection,
};

export default meta;

export const Loading: StoryObj<typeof PaymentSection> = {
  args: {
    loading: true,
  },
};
