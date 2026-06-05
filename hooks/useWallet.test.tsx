import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import useWallet from "./useWallet";
import { WalletProvider } from "@/components/providers/WalletProvider";
import * as freighter from "@/lib/stellar/freighter";
import * as stellarAuth from "@/lib/stellar";

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

function TestHarness() {
  const { isConnected, publicKey, token, error, connect, disconnect } = useWallet();

  return (
    <div>
      <span data-testid="isConnected">{isConnected ? "true" : "false"}</span>
      <span data-testid="publicKey">{publicKey ?? ""}</span>
      <span data-testid="token">{token ?? ""}</span>
      <span data-testid="error">{error ?? ""}</span>
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
    (freighter.isFreighterInstalled as any).mockResolvedValue(true);
    (freighter.isConnected as any).mockResolvedValue(false);
    (freighter.connectFreighter as any).mockResolvedValue("GABCDEF1234567890XYZ");
    (stellarAuth.getChallenge as any).mockResolvedValue("challenge-tx");
    (freighter.signTransaction as any).mockResolvedValue("signed-transaction");
    (stellarAuth.verifyChallenge as any).mockResolvedValue("jwt-token");

    render(
      <WalletProvider>
        <TestHarness />
      </WalletProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: /^Connect$/i }));

    await waitFor(() => expect(screen.getByTestId("isConnected")).toHaveTextContent("true"));
    expect(screen.getByTestId("publicKey")).toHaveTextContent("GABCDEF1234567890XYZ");
    expect(window.localStorage.getItem("wallet.token")).toBe("jwt-token");
  });

  it("stores token after auth flow", async () => {
    (freighter.isFreighterInstalled as any).mockResolvedValue(true);
    (freighter.isConnected as any).mockResolvedValue(false);
    (freighter.connectFreighter as any).mockResolvedValue("GXYZ1234567890ABCD");
    (stellarAuth.getChallenge as any).mockResolvedValue("challenge-transaction");
    (freighter.signTransaction as any).mockResolvedValue("signed-challenge");
    (stellarAuth.verifyChallenge as any).mockResolvedValue("sep10-jwt");

    render(
      <WalletProvider>
        <TestHarness />
      </WalletProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: /^Connect$/i }));

    await waitFor(() => expect(window.localStorage.getItem("wallet.token")).toBe("sep10-jwt"));
    expect(screen.getByTestId("token")).toHaveTextContent("sep10-jwt");
  });

  it("disconnects and clears publicKey and token", async () => {
    (freighter.isFreighterInstalled as any).mockResolvedValue(true);
    (freighter.isConnected as any).mockResolvedValue(true);
    
    window.localStorage.setItem("wallet.token", "existing-jwt");
    window.localStorage.setItem("wallet.publicKey", "GDISCONNECT1234");

    render(
      <WalletProvider>
        <TestHarness />
      </WalletProvider>
    );

    await waitFor(() => expect(screen.getByTestId("isConnected")).toHaveTextContent("true"));

    await userEvent.click(screen.getByRole("button", { name: /disconnect/i }));

    expect(screen.getByTestId("publicKey")).toHaveTextContent("");
    expect(screen.getByTestId("token")).toHaveTextContent("");
    expect(window.localStorage.getItem("wallet.token")).toBeNull();
  });
});
