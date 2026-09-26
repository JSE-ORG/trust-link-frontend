import type { Meta, StoryObj } from "@storybook/react";
import { Home, Package, Settings } from "lucide-react";

import { Breadcrumb } from "./Breadcrumb";

const meta: Meta<typeof Breadcrumb> = {
  title: "UI/Breadcrumb",
  component: Breadcrumb,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Accessible breadcrumb trail (`nav[aria-label=Breadcrumb]`). The last item, or any item " +
          "without an `href`, renders as plain text instead of a link.",
      },
    },
  },
  argTypes: {
    items: {
      control: "object",
      description: "Array of `{ label, href?, icon? }` entries, in order from root to current page.",
    },
    className: {
      control: "text",
      description: "Additional CSS classes applied to the wrapping <nav>.",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Breadcrumb>;

/**
 * Default state — a simple trail with the current page shown as plain text.
 */
export const Default: Story = {
  args: {
    items: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Escrows", href: "/dashboard/escrows" },
      { label: "Escrow #4821" },
    ],
  },
};

/**
 * Each crumb carries a leading icon, useful for reinforcing section identity
 * at a glance (e.g. Home, Orders, Settings).
 */
export const WithIcons: Story = {
  args: {
    items: [
      { label: "Home", href: "/", icon: <Home className="h-3.5 w-3.5" /> },
      { label: "Orders", href: "/orders", icon: <Package className="h-3.5 w-3.5" /> },
      { label: "Settings", icon: <Settings className="h-3.5 w-3.5" /> },
    ],
  },
};

/**
 * Just two levels — root and current page.
 */
export const TwoLevels: Story = {
  args: {
    items: [{ label: "Vendors", href: "/vendors" }, { label: "Acme Supplies" }],
  },
};

/**
 * A deeper trail to confirm wrapping/spacing holds up with more segments.
 */
export const DeepTrail: Story = {
  args: {
    items: [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Vendors", href: "/dashboard/vendors" },
      { label: "Acme Supplies", href: "/dashboard/vendors/acme" },
      { label: "Escrows", href: "/dashboard/vendors/acme/escrows" },
      { label: "Escrow #4821" },
    ],
  },
};
