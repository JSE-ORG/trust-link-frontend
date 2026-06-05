import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import WalletConnectButton from "./WalletConnectButton";
import { WalletProvider } from "@/components/providers/WalletProvider";
import * as freighter from "@/lib/stellar/freighter";

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

import * as stellarAuth from "@/lib/stellar";

describe("WalletConnectButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("shows Connect Wallet when disconnected", async () => {
    (freighter.isFreighterInstalled as any).mockResolvedValue(true);
    (freighter.isConnected as any).mockResolvedValue(false);

    render(
      <WalletProvider>
        <WalletConnectButton />
      </WalletProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /connect wallet/i })).toBeInTheDocument();
    });
  });

  it("shows connecting indicator while connecting", async () => {
    (freighter.isFreighterInstalled as any).mockResolvedValue(true);
    (freighter.isConnected as any).mockResolvedValue(false);
    (freighter.connectFreighter as any).mockResolvedValue("GABCDE12345XYZ");
    (stellarAuth.getChallenge as any).mockResolvedValue("challenge");
    (freighter.signTransaction as any).mockResolvedValue("signed-tx");
    (stellarAuth.verifyChallenge as any).mockResolvedValue("jwt-token");

    render(
      <WalletProvider>
        <WalletConnectButton />
      </WalletProvider>
    );

    const button = await screen.findByRole("button", { name: /connect wallet/i });
    fireEvent.click(button);

    expect(screen.getByRole("button", { name: /connecting/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/GABCD...45XYZ/i)).toBeInTheDocument();
    });
  });

  it("shows install prompt when Freighter is absent", async () => {
    (freighter.isFreighterInstalled as any).mockResolvedValue(false);
    
    render(
      <WalletProvider>
        <WalletConnectButton />
      </WalletProvider>
    );

    await waitFor(() => {
      expect(screen.getByRole("link", { name: /install freighter/i })).toBeInTheDocument();
    });
  });
});
