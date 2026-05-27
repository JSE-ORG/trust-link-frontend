import type { Meta, StoryObj } from "@storybook/react";
import VendorDashboardList from "./VendorDashboardList";

const meta: Meta<typeof VendorDashboardList> = {
  title: "Dashboard/VendorDashboardList",
  component: VendorDashboardList,
};

export default meta;

export const Loading: StoryObj<typeof VendorDashboardList> = {
  args: {
    loading: true,
  },
};
