import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach,describe, expect, it, vi } from "vitest";

import { NetworkProvider } from "@/components/providers/NetworkProvider";
import { WalletProvider } from "@/components/providers/WalletProvider";
import * as stellarAuth from "@/lib/stellar";
import * as freighter from "@/lib/stellar/freighter";

import useWallet from "./useWallet";

vi.mock("@/lib/stellar/freighter", () => ({
  isFreighterInstalled: vi.fn(),
  isConnected: vi.fn(),
  connectFreighter: vi.fn(),
  signTransaction: vi.fn(),
}));

vi.mock("@/lib/stellar", () => ({
  getChallenge: vi.fn(),
  verifyChallenge: vi.fn(),
}));

vi.mock("jwt-decode", () => ({
  jwtDecode: vi.fn(() => ({ exp: Date.now() / 1000 + 3600 })),
}));

function TestHarness() {
  const { isConnected, publicKey, token, error, connect, disconnect } = useWallet();

  return (
    <div>
      <span data-testid="isConnected">{isConnected ? "true" : "false"}</span>
      <span data-testid="publicKey">{publicKey ?? ""}</span>
      <span data-testid="token">{token ?? ""}</span>
      <span data-testid="error">{error?.message ?? ""}</span>
      <button onClick={connect}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}

describe("useWallet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.stubGlobal("fetch", vi.fn());
  });

  it("connects and populates publicKey", async () => {
    vi.mocked(freighter.isFreighterInstalled).mockResolvedValue(true);
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: false });
    vi.mocked(freighter.connectFreighter).mockResolvedValue("GABCDEF1234567890XYZ");
    vi.mocked(stellarAuth.getChallenge).mockResolvedValue("challenge-tx");
    vi.mocked(freighter.signTransaction).mockResolvedValue("signed-transaction");
    vi.mocked(stellarAuth.verifyChallenge).mockResolvedValue("jwt-token");

    render(
      <NetworkProvider>
        <WalletProvider>
          <TestHarness />
        </WalletProvider>
      </NetworkProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: /^Connect$/i }));

    await waitFor(() => expect(screen.getByTestId("isConnected")).toHaveTextContent("true"));
    expect(screen.getByTestId("publicKey")).toHaveTextContent("GABCDEF1234567890XYZ");
    expect(window.localStorage.getItem("wallet.token")).toBe("jwt-token");
  });

  it("stores token after auth flow", async () => {
    vi.mocked(freighter.isFreighterInstalled).mockResolvedValue(true);
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: false });
    vi.mocked(freighter.connectFreighter).mockResolvedValue("GXYZ1234567890ABCD");
    vi.mocked(stellarAuth.getChallenge).mockResolvedValue("challenge-transaction");
    vi.mocked(freighter.signTransaction).mockResolvedValue("signed-challenge");
    vi.mocked(stellarAuth.verifyChallenge).mockResolvedValue("sep10-jwt");

    render(
      <NetworkProvider>
        <WalletProvider>
          <TestHarness />
        </WalletProvider>
      </NetworkProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: /^Connect$/i }));

    await waitFor(() => expect(window.localStorage.getItem("wallet.token")).toBe("sep10-jwt"));
    expect(screen.getByTestId("token")).toHaveTextContent("sep10-jwt");
  });

  it("disconnects and clears publicKey and token", async () => {
    vi.mocked(freighter.isFreighterInstalled).mockResolvedValue(true);
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: true });
    
    window.localStorage.setItem("wallet.token", "existing-jwt");
    window.localStorage.setItem("wallet.publicKey", "GDISCONNECT1234");

    render(
      <NetworkProvider>
        <WalletProvider>
          <TestHarness />
        </WalletProvider>
      </NetworkProvider>
    );

    await waitFor(() => expect(screen.getByTestId("isConnected")).toHaveTextContent("true"));

    await userEvent.click(screen.getByRole("button", { name: /disconnect/i }));

    expect(screen.getByTestId("publicKey")).toHaveTextContent("");
    expect(screen.getByTestId("token")).toHaveTextContent("");
    expect(window.localStorage.getItem("wallet.token")).toBeNull();
  });
});
