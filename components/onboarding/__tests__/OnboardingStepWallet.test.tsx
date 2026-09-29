import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import OnboardingStepWallet from "../OnboardingStepWallet";

// Mock the WalletConnectButton component to avoid external dependencies
vi.mock("@/components/wallet/WalletConnectButton", () => ({
  default: () => <button>Connect Wallet</button>,
}));

describe("OnboardingStepWallet", () => {
  it("renders heading and connection status when not connected", () => {
    render(
      <OnboardingStepWallet isConnected={false} publicKey={null} isInstalled={true} />
    );
    expect(screen.getByRole("heading", { name: /Connect Your Wallet/i })).toBeInTheDocument();
    expect(screen.getByText(/Not connected/i)).toBeInTheDocument();
    expect(screen.queryByText(/Public key:/i)).not.toBeInTheDocument();
  });

  it("shows public key when provided and connected", () => {
    render(
      <OnboardingStepWallet
        isConnected={true}
        publicKey="GABCDEF123456"
        isInstalled={true}
      />
    );
    expect(screen.getByText(/Connected/i)).toBeInTheDocument();
    expect(screen.getByText(/Public key:/i)).toBeInTheDocument();
    expect(screen.getByText(/GABCDEF123456/)).toBeInTheDocument();
  });

  it("displays warning when Freighter extension is not installed", () => {
    render(
      <OnboardingStepWallet isConnected={false} publicKey={null} isInstalled={false} />
    );
    expect(
      screen.getByText(/Freighter extension not detected\. Please install it to continue\./i)
    ).toBeInTheDocument();
  });
});
