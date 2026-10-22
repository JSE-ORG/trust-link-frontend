import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getVendorNotificationPreferences, patchVendorNotifications, type VendorNotificationPreferences } from "@/lib/api";

import NotificationsClient from "./NotificationsClient";

vi.mock("@/hooks/useWallet", () => ({
  default: () => ({ token: "notification-token", connect: vi.fn() }),
}));

vi.mock("@/lib/api", () => ({
  getVendorNotificationPreferences: vi.fn(),
  patchVendorNotifications: vi.fn(),
}));

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

const events = [
  ["funded", "Funded", "Your escrow has been funded"],
  ["shipped", "Shipped", "The item has been shipped"],
  ["delivered", "Delivered", "The item has been delivered"],
  ["disputed", "Disputed", "A dispute has been opened"],
  ["completed", "Completed", "Escrow transaction completed"],
] as const;
const channels = ["email", "sms"] as const;

function preferences(): VendorNotificationPreferences {
  return {
    funded: { email: true, sms: false },
    shipped: { email: false, sms: true },
    delivered: { email: true, sms: true },
    disputed: { email: false, sms: false },
    completed: { email: false, sms: true },
  };
}

function expectMatrix(expected: VendorNotificationPreferences) {
  expect(screen.getAllByRole("switch")).toHaveLength(10);
  for (const [event, label] of events) {
    for (const channel of channels) {
      expect(screen.getByRole("switch", { name: `${label} ${channel}` })).toHaveAttribute(
        "aria-checked", String(expected[event][channel]),
      );
    }
  }
}

async function renderPreferences() {
  render(<NotificationsClient />);
  await screen.findByRole("switch", { name: "Funded email" });
}

describe("NotificationsClient event and channel matrix", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(getVendorNotificationPreferences).mockResolvedValue(preferences());
    vi.mocked(patchVendorNotifications).mockResolvedValue(undefined);
  });

  afterEach(cleanup);

  it("loads every channel from the authenticated nonuniform matrix", async () => {
    await renderPreferences();

    expect(getVendorNotificationPreferences).toHaveBeenCalledExactlyOnceWith("notification-token");
    expectMatrix(preferences());
    expect(patchVendorNotifications).not.toHaveBeenCalled();
  });

  it.each(events.flatMap(([event, label]) => channels.map((channel) => ({ event, label, channel }))))(
    "toggles only $label $channel and saves the complete matrix",
    async ({ event, label, channel }) => {
      const user = userEvent.setup();
      await renderPreferences();
      const expected = preferences();
      expected[event][channel] = !expected[event][channel];

      await user.click(screen.getByRole("switch", { name: `${label} ${channel}` }));
      expectMatrix(expected);
      await user.click(screen.getByRole("button", { name: "Save preferences" }));

      await waitFor(() => expect(patchVendorNotifications).toHaveBeenCalledExactlyOnceWith(
        expected, "notification-token",
      ));
      expectMatrix(expected);
    },
  );

  it("combines multiple independent edits in a single save", async () => {
    const user = userEvent.setup();
    await renderPreferences();
    await user.click(screen.getByRole("switch", { name: "Funded sms" }));
    await user.click(screen.getByRole("switch", { name: "Shipped email" }));
    await user.click(screen.getByRole("switch", { name: "Delivered email" }));
    const expected = preferences();
    expected.funded.sms = true;
    expected.shipped.email = true;
    expected.delivered.email = false;
    expectMatrix(expected);

    await user.click(screen.getByRole("button", { name: "Save preferences" }));
    await waitFor(() => expect(patchVendorNotifications).toHaveBeenCalledExactlyOnceWith(
      expected, "notification-token",
    ));
  });

  it("opens the matching real email for every preview action", async () => {
    const user = userEvent.setup();
    await renderPreferences();

    for (const [, label, heading] of events) {
      await user.click(screen.getByRole("button", { name: `Preview ${label} email` }));
      const dialog = await screen.findByRole("dialog");
      expect(within(dialog).getByRole("heading", { name: heading })).toBeInTheDocument();
      expect(within(dialog).getByRole("link", { name: "View in Dashboard" })).toBeInTheDocument();
      await user.click(within(dialog).getByRole("button", { name: "Close" }));
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    }

    expectMatrix(preferences());
    expect(patchVendorNotifications).not.toHaveBeenCalled();
  });
});
