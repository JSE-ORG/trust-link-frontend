import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import useWallet from "@/hooks/useWallet";

import VendorOnboardingWizard from "../VendorOnboardingWizard";

const { mockPush } = vi.hoisted(() => ({
  mockPush: vi.fn(),
}));

vi.mock("@/hooks/useWallet", () => ({
  default: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const STORAGE_KEY = "vendor.onboarding.state";

const VALID_DESCRIPTION = "Handmade stellar goods for interplanetary traders.";

type WalletOverrides = Partial<{
  isConnected: boolean;
  publicKey: string | null;
  isInstalled: boolean;
  status: string;
  isLoading: boolean;
  walletReady: boolean;
  error: string | null;
  token: string | null;
  jwt: string | null;
}>;

function mockWallet(overrides: WalletOverrides = {}) {
  (useWallet as unknown as Mock).mockReturnValue({
    isConnected: false,
    publicKey: null,
    isInstalled: true,
    status: "disconnected",
    isLoading: false,
    walletReady: true,
    error: null,
    token: null,
    jwt: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
    ...overrides,
  });
}

function mockConnectedWallet() {
  mockWallet({
    isConnected: true,
    status: "connected",
    publicKey: "GTESTPUBLICKEY",
  });
}

function shopNameInput() {
  return screen.getByPlaceholderText("Example: Stellar Craft Co.");
}

function descriptionInput() {
  return screen.getByPlaceholderText(
    "Tell buyers why they should choose your products."
  );
}

function websiteInput() {
  return screen.getByPlaceholderText("https://");
}

function fillValidProfile() {
  fireEvent.change(shopNameInput(), {
    target: { value: "Stellar Craft Co." },
  });
  fireEvent.change(descriptionInput(), { target: { value: VALID_DESCRIPTION } });
}

async function renderAtProfileStep() {
  render(<VendorOnboardingWizard />);
  await screen.findByRole("heading", { name: "Vendor Profile" });
}

describe("VendorOnboardingWizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockWallet();
  });

  it("disables the Continue button when the wallet is disconnected", () => {
    render(<VendorOnboardingWizard />);

    expect(
      screen.getByRole("heading", { name: "Connect Your Wallet" })
    ).toBeInTheDocument();
    expect(screen.getByText("Not connected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("auto-advances to the profile step when the wallet is connected", async () => {
    mockConnectedWallet();
    render(<VendorOnboardingWizard />);

    expect(
      await screen.findByRole("heading", { name: "Vendor Profile" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
  });

  it("jumps between steps using the stepper without validation", async () => {
    mockConnectedWallet();
    await renderAtProfileStep();

    // No profile data entered yet — the stepper bypasses validation.
    fireEvent.click(screen.getByRole("button", { name: /Review & Finish/ }));
    expect(
      await screen.findByRole("heading", { name: "Review Your Store" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Vendor Profile/ }));
    expect(
      await screen.findByRole("heading", { name: "Vendor Profile" })
    ).toBeInTheDocument();
  });

  it("returns to the wallet step when navigating back while disconnected", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        step: 1,
        shopName: "Restored Shop",
        description: "Restored description that is long enough.",
        website: "",
        shippingLocations: "",
        completed: false,
      })
    );
    render(<VendorOnboardingWizard />);
    await screen.findByDisplayValue("Restored Shop");

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(
      await screen.findByRole("heading", { name: "Connect Your Wallet" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();
  });

  it("blocks advancing when the shop name is empty", async () => {
    mockConnectedWallet();
    await renderAtProfileStep();

    fireEvent.change(descriptionInput(), {
      target: { value: VALID_DESCRIPTION },
    });

    const nextButton = screen.getByRole("button", { name: "Next" });
    expect(nextButton).toBeDisabled();
    // React does not dispatch onClick for disabled buttons, so the click
    // below must leave the wizard on the profile step.
    fireEvent.click(nextButton);

    expect(
      screen.getByRole("heading", { name: "Vendor Profile" })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Review Your Store" })
    ).not.toBeInTheDocument();
  });

  it("blocks advancing when the description is shorter than 20 characters", async () => {
    mockConnectedWallet();
    await renderAtProfileStep();

    fireEvent.change(shopNameInput(), {
      target: { value: "Stellar Craft Co." },
    });
    fireEvent.change(descriptionInput(), { target: { value: "Too short" } });

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(
      screen.getByText("Minimum 20 characters required.")
    ).toBeInTheDocument();

    fireEvent.change(descriptionInput(), {
      target: { value: VALID_DESCRIPTION },
    });
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("navigates forward to review and back to the profile step, preserving input", async () => {
    mockConnectedWallet();
    await renderAtProfileStep();

    fillValidProfile();
    const nextButton = screen.getByRole("button", { name: "Next" });
    expect(nextButton).toBeEnabled();
    fireEvent.click(nextButton);

    expect(
      await screen.findByRole("heading", { name: "Review Your Store" })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Back" }));

    expect(
      await screen.findByRole("heading", { name: "Vendor Profile" })
    ).toBeInTheDocument();
    expect(shopNameInput()).toHaveValue("Stellar Craft Co.");
    expect(descriptionInput()).toHaveValue(VALID_DESCRIPTION);
  });

  it("shows an inline validation error for an invalid website URL", async () => {
    mockConnectedWallet();
    await renderAtProfileStep();

    fillValidProfile();
    fireEvent.change(websiteInput(), { target: { value: "http://" } });

    // Shop name and description are valid, so Next stays enabled and the
    // profile step can surface the website error inline.
    const nextButton = screen.getByRole("button", { name: "Next" });
    expect(nextButton).toBeEnabled();
    fireEvent.click(nextButton);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please enter a valid website URL."
    );
    expect(
      screen.getByRole("heading", { name: "Vendor Profile" })
    ).toBeInTheDocument();

    // Editing the field clears its error, and the wizard can advance.
    fireEvent.change(websiteInput(), { target: { value: "example.com" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(
      await screen.findByRole("heading", { name: "Review Your Store" })
    ).toBeInTheDocument();
  });

  it("persists in-progress state to localStorage", async () => {
    mockConnectedWallet();
    await renderAtProfileStep();

    fireEvent.change(shopNameInput(), { target: { value: "Persisted Shop" } });

    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      expect(saved).toMatchObject({ step: 1, shopName: "Persisted Shop" });
    });
  });

  it("hydrates previously saved state from localStorage", async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        step: 1,
        shopName: "Restored Shop",
        description: "Restored description that is long enough.",
        website: "https://example.com/",
        shippingLocations: "",
        completed: false,
      })
    );
    render(<VendorOnboardingWizard />);

    expect(
      await screen.findByRole("heading", { name: "Vendor Profile" })
    ).toBeInTheDocument();
    expect(shopNameInput()).toHaveValue("Restored Shop");
    expect(websiteInput()).toHaveValue("https://example.com/");
  });

  it("falls back to the default state when persisted JSON is corrupted", async () => {
    localStorage.setItem(STORAGE_KEY, "{not-valid-json");
    render(<VendorOnboardingWizard />);

    expect(
      await screen.findByRole("heading", { name: "Connect Your Wallet" })
    ).toBeInTheDocument();
    await waitFor(() => {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
      expect(saved).toMatchObject({ step: 0, completed: false });
    });
  });

  it("completes onboarding, clears persisted state, and routes to the dashboard", async () => {
    mockConnectedWallet();
    await renderAtProfileStep();

    fillValidProfile();
    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByRole("heading", { name: "Review Your Store" });

    fireEvent.click(screen.getByRole("button", { name: "Complete Onboarding" }));

    expect(
      await screen.findByRole("heading", { name: "Onboarding Complete" })
    ).toBeInTheDocument();
    expect(mockPush).toHaveBeenCalledWith("/dashboard");
    await waitFor(() => {
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });
});
