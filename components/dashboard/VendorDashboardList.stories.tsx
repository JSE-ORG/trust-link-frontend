import type { Meta, StoryObj } from "@storybook/react";

import { mockVendorEscrows } from "../../.storybook/mock-api";
import VendorDashboardList from "./VendorDashboardList";

const meta: Meta<typeof VendorDashboardList> = {
  title: "Dashboard/VendorDashboardList",
  component: VendorDashboardList,
  parameters: {
    docs: {
      description: {
        component:
          "Displays a filterable, paginated list of vendor escrows with table/card view toggles. " +
          "Previewed in Storybook with mock API and wallet fixtures.",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof VendorDashboardList>;

/**
 * Default — loaded list showing active escrows with mock data.
 */
export const Default: Story = {
  parameters: {
    wallet: { status: "connected" },
    mockApi: { escrows: mockVendorEscrows },
    docs: {
      description: {
        story: "Renders the vendor dashboard with loaded escrows using mock API fixtures.",
      },
    },
  },
};

/**
 * Loading — skeleton state while data is being fetched.
 */
export const Loading: Story = {
  args: {
    loading: true,
  },
  parameters: {
    wallet: { status: "connected" },
    docs: {
      description: {
        story: "Renders the loading skeleton state while escrows are in-flight.",
      },
    },
  },
};

/**
 * Empty — when the vendor has no escrows yet.
 */
export const Empty: Story = {
  parameters: {
    wallet: { status: "connected" },
    mockApi: { escrows: [] },
    docs: {
      description: {
        story: "Renders the empty state illustration when the vendor has no escrows.",
      },
    },
  },
};

/**
 * Error — network failure when fetching escrows.
 */
export const Error: Story = {
  parameters: {
    wallet: { status: "connected" },
    mockApi: { simulateError: true },
    docs: {
      description: {
        story: "Renders the error state banner with a retry action when the fetch fails.",
      },
    },
  },
};

/**
 * Disconnected Wallet — when the user's wallet is not connected.
 */
export const DisconnectedWallet: Story = {
  parameters: {
    wallet: { status: "disconnected" },
    docs: {
      description: {
        story: "Renders with a disconnected mock wallet state.",
      },
    },
  },
};
