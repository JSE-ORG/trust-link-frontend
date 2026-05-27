import type { Meta, StoryObj } from "@storybook/react";
import TrackingTimeline from "./TrackingTimeline";

const meta: Meta<typeof TrackingTimeline> = {
  title: "Tracking/TrackingTimeline",
  component: TrackingTimeline,
};

export default meta;

export const Loading: StoryObj<typeof TrackingTimeline> = {
  args: {
    loading: true,
  },
};
