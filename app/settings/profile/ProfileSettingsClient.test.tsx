import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ProfileSettingsClient from "./ProfileSettingsClient";

vi.mock("@/hooks/useWallet", () => ({
  default: () => ({ publicKey: null }),
}));

const STORAGE_KEY = "vendor.profile";

function fillAndSubmit(businessName: string) {
  fireEvent.change(screen.getByLabelText(/Business Name/), {
    target: { value: businessName },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
}

describe("ProfileSettingsClient storage failures", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each([
    ["QuotaExceededError", /storage is full/i],
    ["SecurityError", /blocking site storage/i],
  ])("shows an inline error for %s and keeps edits", (name, message) => {
    const setItem = vi
      .spyOn(localStorage, "setItem")
      .mockImplementation(() => {
        throw new DOMException("denied", name);
      });

    render(<ProfileSettingsClient />);
    expect(() => fillAndSubmit("Acme Goods")).not.toThrow();

    expect(setItem).toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(message);
    expect(screen.queryByText("Profile saved in this browser.")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/Business Name/)).toHaveValue("Acme Goods");
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeEnabled();
  });

  it("clears the error and reports success after a successful retry", () => {
    const setItem = vi
      .spyOn(localStorage, "setItem")
      .mockImplementationOnce(() => {
        throw new DOMException("full", "QuotaExceededError");
      });

    render(<ProfileSettingsClient />);
    fillAndSubmit("Acme Goods");
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(setItem).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByText("Profile saved in this browser.")).toBeInTheDocument();
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")).toMatchObject({
      businessName: "Acme Goods",
    });
  });

  it("falls back to a generic retry message for unknown errors", () => {
    vi.spyOn(localStorage, "setItem").mockImplementation(() => {
      throw new Error("boom");
    });

    render(<ProfileSettingsClient />);
    fillAndSubmit("Acme Goods");

    expect(screen.getByRole("alert")).toHaveTextContent(/please try again/i);
    expect(screen.getByLabelText(/Business Name/)).toHaveValue("Acme Goods");
  });

  describe("accessibility and validation failures", () => {
    it("marks required fields and exposes aria-required", () => {
      render(<ProfileSettingsClient />);
      const businessNameInput = screen.getByLabelText(/Business Name/);
      expect(businessNameInput).toHaveAttribute("required");
      expect(businessNameInput).toHaveAttribute("aria-required", "true");
    });

    it("announces failed submission and moves focus predictably to the first invalid control", () => {
      render(<ProfileSettingsClient />);
      const businessNameInput = screen.getByLabelText(/Business Name/);
      fireEvent.change(businessNameInput, { target: { value: "" } });

      const submitButton = screen.getByRole("button", { name: "Save Changes" });
      fireEvent.click(submitButton);

      expect(businessNameInput).toHaveAttribute("aria-invalid", "true");
      expect(businessNameInput).toHaveFocus();
      expect(screen.getByText("Business name is required.")).toBeInTheDocument();
      expect(
        screen.getByText("Please correct the errors in the form before saving.")
      ).toHaveAttribute("role", "alert");
    });

    it("focuses invalid email when business name is valid but email is invalid", () => {
      render(<ProfileSettingsClient />);
      const businessNameInput = screen.getByLabelText(/Business Name/);
      const emailInput = screen.getByLabelText(/Contact Email/);

      fireEvent.change(businessNameInput, { target: { value: "Acme Goods" } });
      fireEvent.change(emailInput, { target: { value: "invalid-email" } });

      fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

      expect(emailInput).toHaveAttribute("aria-invalid", "true");
      expect(emailInput).toHaveFocus();
      expect(screen.getByText("Enter a valid email address.")).toHaveAttribute("role", "alert");
    });
  });
});
