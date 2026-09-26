import type { Meta, StoryObj } from "@storybook/react";

import { SkeletonTable } from "./SkeletonTable";

const meta: Meta<typeof SkeletonTable> = {
  title: "UI/SkeletonTable",
  component: SkeletonTable,
  argTypes: {
    rows: { control: { type: "number", min: 1, max: 10, step: 1 } },
    columns: { control: { type: "number", min: 1, max: 8, step: 1 } },
    title: { control: "text" },
    className: { control: "text" },
  },
};

export default meta;

type Story = StoryObj<typeof SkeletonTable>;

export const Default: Story = {
  args: {
    rows: 5,
    columns: 4,
    title: "Loading data",
  },
};

export const Compact: Story = {
  args: {
    rows: 2,
    columns: 2,
  },
};
