import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import useWallet from "./useWallet";
import { WalletProvider } from "@/components/providers/WalletProvider";

vi.mock("@/lib/stellar/freighter", () => ({
  getPublicKey: vi.fn(),
  isFreighterInstalled: vi.fn(),
  signTransaction: vi.fn(),
}));

vi.mock("@/lib/stellar", () => ({
  getChallenge: vi.fn(),
  verifyChallenge: vi.fn(),
}));

import * as freighter from "@/lib/stellar/freighter";
import * as stellar from "@/lib/stellar";

afterEach(() => {
  vi.clearAllMocks();
});

function TestHarness() {
  const { status, publicKey, jwt, error, connect, disconnect } = useWallet();

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="publicKey">{publicKey ?? ""}</span>
      <span data-testid="jwt">{jwt ?? ""}</span>
      <span data-testid="error">{error ?? ""}</span>
      <button onClick={connect}>Connect</button>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}

describe("useWallet", () => {
  beforeEach(() => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("connects and populates publicKey and jwt via provider context", async () => {
    vi.mocked(freighter.isFreighterInstalled).mockResolvedValue(true);
    vi.mocked(freighter.getPublicKey).mockResolvedValue("GABCDEF1234567890XYZ");
    vi.mocked(freighter.signTransaction).mockResolvedValue("signed-transaction");
    vi.mocked(stellar.getChallenge).mockResolvedValue("challenge-tx");
    vi.mocked(stellar.verifyChallenge).mockResolvedValue("jwt-token");

    render(
      <WalletProvider>
        <TestHarness />
      </WalletProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: /^Connect$/i }));

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("connected"));
    expect(screen.getByTestId("publicKey")).toHaveTextContent("GABCDEF1234567890XYZ");
    expect(screen.getByTestId("jwt")).toHaveTextContent("jwt-token");
    expect(stellar.getChallenge).toHaveBeenCalledWith("GABCDEF1234567890XYZ");
  });

  it("disconnects and clears publicKey and jwt", async () => {
    vi.mocked(freighter.isFreighterInstalled).mockResolvedValue(true);
    vi.mocked(freighter.getPublicKey).mockResolvedValue("GXYZ1234567890ABCD");
    vi.mocked(freighter.signTransaction).mockResolvedValue("signed-challenge");
    vi.mocked(stellar.getChallenge).mockResolvedValue("challenge-transaction");
    vi.mocked(stellar.verifyChallenge).mockResolvedValue("sep10-jwt");

    render(
      <WalletProvider>
        <TestHarness />
      </WalletProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: /^Connect$/i }));
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("connected"));

    await userEvent.click(screen.getByRole("button", { name: /disconnect/i }));

    expect(screen.getByTestId("publicKey")).toHaveTextContent("");
    expect(screen.getByTestId("jwt")).toHaveTextContent("");
    expect(screen.getByTestId("status")).toHaveTextContent("disconnected");
  });

  it("shows error when Freighter is not installed", async () => {
    vi.mocked(freighter.isFreighterInstalled).mockResolvedValue(false);

    render(
      <WalletProvider>
        <TestHarness />
      </WalletProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: /^Connect$/i }));

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("not-installed"));
    expect(screen.getByTestId("error")).toHaveTextContent("Freighter is not installed");
  });
});
