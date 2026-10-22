import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { EMPTY_LOCAL_PROFILE, LOCAL_PROFILE_KEY, type LocalVendorProfile } from "@/lib/local-profile";

import ProfileSettingsClient from "./ProfileSettingsClient";

vi.mock("@/hooks/useWallet", () => ({
  default: () => ({ publicKey: "GCONNECTED_WALLET" }),
}));

const profile: LocalVendorProfile = {
  businessName: "Acme Goods",
  displayName: "@acme",
  email: "hello@acme.example",
  bio: "Quality goods with secure escrow.",
  website: "https://acme.example",
  shippingLocations: "Lagos, Abuja",
};

const fields = [
  ["businessName", /Business Name/],
  ["displayName", "Display Name"],
  ["email", "Contact Email"],
  ["bio", "Short Bio"],
  ["website", "Website"],
  ["shippingLocations", "Shipping Locations"],
] as const;

describe("ProfileSettingsClient validation and persistence", () => {
  beforeEach(() => localStorage.clear());

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it.each(["", "   "])("rejects missing business name %j without writing storage", async (name) => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(localStorage, "setItem");
    render(<ProfileSettingsClient />);
    if (name) await user.type(screen.getByLabelText(/Business Name/), name);
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(screen.getByText("Business name is required.")).toBeInTheDocument();
    expect(setItem).not.toHaveBeenCalled();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("rejects an email missing a domain suffix, then allows correction", async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(localStorage, "setItem");
    render(<ProfileSettingsClient />);
    await user.type(screen.getByLabelText(/Business Name/), profile.businessName);
    // Valid to the browser's email input, but rejected by the form's validator.
    await user.type(screen.getByLabelText("Contact Email"), "vendor@example");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(screen.getByText("Enter a valid email address.")).toBeInTheDocument();
    expect(setItem).not.toHaveBeenCalled();

    await user.clear(screen.getByLabelText("Contact Email"));
    await user.type(screen.getByLabelText("Contact Email"), profile.email);
    expect(screen.queryByText("Enter a valid email address.")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(setItem).toHaveBeenCalledExactlyOnceWith(LOCAL_PROFILE_KEY, JSON.stringify({
      ...EMPTY_LOCAL_PROFILE, businessName: profile.businessName, email: profile.email,
    }));
  });

  it("allows blank optional email and saves only supported fields", async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(localStorage, "setItem");
    render(<ProfileSettingsClient />);
    await user.type(screen.getByLabelText(/Business Name/), profile.businessName);
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    const expected = { ...EMPTY_LOCAL_PROFILE, businessName: profile.businessName };
    expect(setItem).toHaveBeenCalledExactlyOnceWith(LOCAL_PROFILE_KEY, JSON.stringify(expected));
    expect(JSON.parse(localStorage.getItem(LOCAL_PROFILE_KEY)!)).toEqual(expected);
    expect(screen.getByRole("status")).toHaveTextContent("Profile saved in this browser.");
  });

  it("saves all supported fields, restores them on remount and remains editable", async () => {
    const user = userEvent.setup();
    const setItem = vi.spyOn(localStorage, "setItem");
    const { unmount } = render(<ProfileSettingsClient />);
    for (const [field, label] of fields) {
      await user.type(screen.getByLabelText(label), profile[field]);
    }
    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(setItem).toHaveBeenCalledExactlyOnceWith(LOCAL_PROFILE_KEY, JSON.stringify(profile));
    expect(JSON.parse(localStorage.getItem(LOCAL_PROFILE_KEY)!)).toEqual(profile);
    expect(screen.getByRole("status")).toHaveTextContent("Profile saved in this browser.");

    unmount();
    render(<ProfileSettingsClient />);
    await waitFor(() => {
      for (const [field, label] of fields) {
        expect(screen.getByLabelText(label)).toHaveValue(profile[field]);
      }
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(setItem).toHaveBeenCalledTimes(1);

    await user.clear(screen.getByLabelText("Display Name"));
    await user.type(screen.getByLabelText("Display Name"), "@new-acme");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(screen.getByRole("status")).toHaveTextContent("Profile saved in this browser.");
    expect(JSON.parse(localStorage.getItem(LOCAL_PROFILE_KEY)!)).toEqual({ ...profile, displayName: "@new-acme" });

    await user.type(screen.getByLabelText("Short Bio"), " Updated.");
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(setItem).toHaveBeenCalledTimes(2);
  });
});
