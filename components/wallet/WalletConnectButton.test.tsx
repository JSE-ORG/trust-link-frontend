import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NetworkProvider } from "@/components/providers/NetworkProvider";
import { WalletProvider } from "@/components/providers/WalletProvider";
import * as freighter from "@/lib/stellar/freighter";

import WalletConnectButton from "./WalletConnectButton";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock the clipboard API
const mockWriteText = vi.fn().mockResolvedValue(undefined);
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

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

  it("renders compact navbar variant when variant='navbar'", async () => {
    vi.mocked(freighter.isFreighterInstalled).mockResolvedValue(true);
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: false });

    render(
      <NetworkProvider>
        <WalletProvider>
          <WalletConnectButton variant="navbar" />
        </WalletProvider>
      </NetworkProvider>
    );

    const button = await screen.findByRole("button", { name: /connect wallet/i });
    expect(button).toHaveClass("h-8");
  });

  it("shows connecting indicator and connected truncated account badge with dropdown", async () => {
    vi.mocked(freighter.isFreighterInstalled).mockResolvedValue(true);
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: false });
    vi.mocked(freighter.connectFreighter).mockResolvedValue("GABCDE12345XYZ");
    vi.mocked(stellarAuth.getChallenge).mockResolvedValue("challenge");
    vi.mocked(freighter.signTransaction).mockResolvedValue("signed-tx");
    vi.mocked(stellarAuth.verifyChallenge).mockResolvedValue("jwt-token");

    const { container } = render(
      <NetworkProvider>
        <WalletProvider>
          <WalletConnectButton variant="navbar" />
        </WalletProvider>
      </NetworkProvider>
    );

    const button = await screen.findByRole("button", { name: /connect wallet/i });
    fireEvent.click(button);

    // Loading state renders a Skeleton
    const skeletons = container.querySelectorAll('[class*="rounded-full"]');
    expect(skeletons.length).toBeGreaterThan(0);

    // Connected state displays truncated address (e.g., GABC...5XYZ)
    const accountBadge = await screen.findByRole("button", { name: /GABC\.\.\.5XYZ/i });
    expect(accountBadge).toBeInTheDocument();

    // Clicking account button toggles dropdown
    fireEvent.click(accountBadge);

    const copyBtn = await screen.findByRole("menuitem", { name: /copy address/i });
    expect(copyBtn).toBeInTheDocument();

    fireEvent.click(copyBtn);
    expect(mockWriteText).toHaveBeenCalledWith("GABCDE12345XYZ");
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Address copied to clipboard");
    });

    const explorerLink = screen.getByRole("menuitem", { name: /view on stellar expert/i });
    expect(explorerLink).toBeInTheDocument();
    expect(explorerLink).toHaveAttribute("target", "_blank");
    expect(explorerLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(explorerLink).toHaveAttribute(
      "href",
      "https://stellar.expert/explorer/testnet/account/GABCDE12345XYZ"
    );

    const disconnectBtn = await screen.findByRole("menuitem", { name: /disconnect/i });
    expect(disconnectBtn).toBeInTheDocument();

    // Clicking disconnect resets session state
    fireEvent.click(disconnectBtn);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /connect wallet/i })).toBeInTheDocument();
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
