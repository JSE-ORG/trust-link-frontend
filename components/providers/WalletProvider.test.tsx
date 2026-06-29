import { render, screen, act } from "@testing-library/react";
import { WalletProvider, useWallet } from "./WalletProvider";
import { NetworkProvider } from "./NetworkProvider";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as freighter from "@/lib/stellar/freighter";
import * as stellar from "@/lib/stellar";

vi.mock("@/lib/stellar/freighter", () => ({
  getPublicKey: vi.fn(),
  signTransaction: vi.fn(),
  isConnected: vi.fn(),
  isFreighterInstalled: vi.fn(),
  connectFreighter: vi.fn(),
}));

vi.mock("@/lib/stellar", () => ({
  getChallenge: vi.fn(),
  verifyChallenge: vi.fn(),
}));

vi.mock("jwt-decode", () => ({
  jwtDecode: vi.fn(() => ({ exp: Date.now() / 1000 + 3600 })),
}));

function TestComponent() {
  const { publicKey, token, connect, isLoading, error } = useWallet();
  return (
    <div>
      <div data-testid="publicKey">{publicKey}</div>
      <div data-testid="token">{token}</div>
      <div data-testid="isLoading">{isLoading.toString()}</div>
      <div data-testid="error">{error}</div>
      <button onClick={connect}>Connect</button>
    </div>
  );
}

function renderWithProviders(ui: React.ReactElement) {
  return render(<NetworkProvider><WalletProvider>{ui}</WalletProvider></NetworkProvider>);
}

describe("WalletProvider SEP-10 Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("completes SEP-10 flow on connect", async () => {
    const mockPubKey = "GABC123";
    const mockChallenge = "challenge-xdr";
    const mockSignedXdr = "signed-xdr";
    const mockToken = "jwt-token";

    (vi.mocked(freighter.isConnected) as any).mockResolvedValue(true as any);
    (vi.mocked(freighter as any).getPublicKey).mockResolvedValue(mockPubKey);
    vi.mocked(stellar.getChallenge).mockResolvedValue(mockChallenge);
    vi.mocked(freighter.signTransaction).mockResolvedValue(mockSignedXdr);
    vi.mocked(stellar.verifyChallenge).mockResolvedValue(mockToken);

    renderWithProviders(<TestComponent />);

    const connectButton = screen.getByText("Connect");
    await act(async () => {
      connectButton.click();
    });

    expect(screen.getByTestId("publicKey")).toHaveTextContent(mockPubKey);
    expect(screen.getByTestId("token")).toHaveTextContent(mockToken);
    expect(stellar.getChallenge).toHaveBeenCalledWith(mockPubKey);
    expect(freighter.signTransaction).toHaveBeenCalledWith(mockChallenge, expect.stringMatching(/TESTNET|PUBLIC/));
    expect(stellar.verifyChallenge).toHaveBeenCalledWith(mockSignedXdr);
  });

  it("handles errors during authentication", async () => {
    (vi.mocked(freighter.isConnected) as any).mockResolvedValue(true as any);
    (vi.mocked(freighter as any).getPublicKey).mockResolvedValue("GABC123");
    vi.mocked(stellar.getChallenge).mockRejectedValue(new Error("Challenge failed"));

    renderWithProviders(<TestComponent />);

    const connectButton = screen.getByText("Connect");
    await act(async () => {
      connectButton.click();
    });

    expect(screen.getByTestId("error")).toHaveTextContent("Challenge failed");
    expect(screen.getByTestId("token")).toBeEmptyDOMElement();
  });
});
