import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach,describe, expect, it, vi } from "vitest";

import { NetworkProvider } from "@/components/providers/NetworkProvider";
import { WalletProvider } from "@/components/providers/WalletProvider";
import * as freighter from "@/lib/stellar/freighter";

import WalletConnectButton from "./WalletConnectButton";

vi.mock("@/lib/stellar/freighter", () => ({
  isFreighterInstalled: vi.fn(),
  isConnected: vi.fn(),
  connectFreighter: vi.fn(),
  signTransaction: vi.fn(),
}));

// Mocking lib/stellar auth functions used in WalletProvider
vi.mock("@/lib/stellar", () => ({
  getChallenge: vi.fn(),
  verifyChallenge: vi.fn(),
}));

vi.mock("jwt-decode", () => ({
  jwtDecode: vi.fn(() => ({ exp: Date.now() / 1000 + 3600 })),
}));

import * as stellarAuth from "@/lib/stellar";

describe("WalletConnectButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("shows Connect Wallet when disconnected", async () => {
    vi.mocked(freighter.isFreighterInstalled).mockResolvedValue(true);
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: false });

    render(
      <NetworkProvider>
        <WalletProvider>
          <WalletConnectButton />
        </WalletProvider>
      </NetworkProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /connect wallet/i })).toBeInTheDocument();
    });
  });

  it("shows connecting indicator while connecting", async () => {
    vi.mocked(freighter.isFreighterInstalled).mockResolvedValue(true);
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: false });
    vi.mocked(freighter.connectFreighter).mockResolvedValue("GABCDE12345XYZ");
    vi.mocked(stellarAuth.getChallenge).mockResolvedValue("challenge");
    vi.mocked(freighter.signTransaction).mockResolvedValue("signed-tx");
    vi.mocked(stellarAuth.verifyChallenge).mockResolvedValue("jwt-token");

    const { container } = render(
      <NetworkProvider>
        <WalletProvider>
          <WalletConnectButton />
        </WalletProvider>
      </NetworkProvider>
    );

    const button = await screen.findByRole("button", { name: /connect wallet/i });
    fireEvent.click(button);

    // Loading state renders a Skeleton
    const skeletons = container.querySelectorAll('[class*="rounded-full"]');
    expect(skeletons.length).toBeGreaterThan(0);

    await waitFor(() => {
      expect(screen.getByText(/GABCD...5XYZ/i)).toBeInTheDocument();
    });
  });

  it("shows install prompt when Freighter is absent", async () => {
    vi.mocked(freighter.isFreighterInstalled).mockResolvedValue(false);
    
    render(
      <NetworkProvider>
        <WalletProvider>
          <WalletConnectButton />
        </WalletProvider>
      </NetworkProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /install freighter/i })).toBeInTheDocument();
    });
  });
});
