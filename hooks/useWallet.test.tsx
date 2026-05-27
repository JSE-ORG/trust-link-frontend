import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";
import useWallet from "./useWallet";

vi.mock("@/lib/stellar/freighter", () => ({
  isFreighterInstalled: vi.fn(),
  connectFreighter: vi.fn(),
  signTransaction: vi.fn(),
}));

import * as freighter from "@/lib/stellar/freighter";

type Deferred<T> = {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (reason?: unknown) => void;
};

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

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
    vi.clearAllMocks();
    window.localStorage.clear();
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("connects and populates publicKey", async () => {
    (freighter.isFreighterInstalled as unknown as vi.Mock).mockResolvedValue(true);
    (freighter.connectFreighter as unknown as vi.Mock).mockResolvedValue({ publicKey: "GABCDEF1234567890XYZ" });
    (freighter.signTransaction as unknown as vi.Mock).mockResolvedValue("signed-transaction");

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ transaction: "challenge-tx", network_passphrase: "Test SDF Network ; September 2015" }),
    });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ token: "jwt-token" }) });

    render(<TestHarness />);
    await userEvent.click(screen.getByRole("button", { name: /^Connect$/i }));

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("connected"));
    expect(screen.getByTestId("publicKey")).toHaveTextContent("GABCDEF1234567890XYZ");
    expect(window.localStorage.getItem("wallet.jwt")).toBe("jwt-token");
  });

  it("stores JWT after SEP-10 auth flow", async () => {
    (freighter.isFreighterInstalled as unknown as vi.Mock).mockResolvedValue(true);
    (freighter.connectFreighter as unknown as vi.Mock).mockResolvedValue({ publicKey: "GXYZ1234567890ABCD" });
    (freighter.signTransaction as unknown as vi.Mock).mockResolvedValue("signed-challenge");

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ transaction: "challenge-transaction", network_passphrase: "Test Network" }),
    });
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ token: "sep10-jwt" }) });

    render(<TestHarness />);
    await userEvent.click(screen.getByRole("button", { name: /^Connect$/i }));

    await waitFor(() => expect(window.localStorage.getItem("wallet.jwt")).toBe("sep10-jwt"));
    expect(screen.getByTestId("jwt")).toHaveTextContent("sep10-jwt");
  });

  it("disconnects and clears publicKey and JWT", async () => {
    window.localStorage.setItem("wallet.jwt", "existing-jwt");
    window.localStorage.setItem("wallet.publicKey", "GDISCONNECT1234");

    render(<TestHarness />);
    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("connected"));

    await userEvent.click(screen.getByRole("button", { name: /disconnect/i }));

    expect(screen.getByTestId("publicKey")).toHaveTextContent("");
    expect(screen.getByTestId("jwt")).toHaveTextContent("");
    expect(window.localStorage.getItem("wallet.jwt")).toBeNull();
  });

  it("shows error when Freighter is not installed", async () => {
    (freighter.isFreighterInstalled as unknown as vi.Mock).mockResolvedValue(false);
    render(<TestHarness />);
    await userEvent.click(screen.getByRole("button", { name: /^Connect$/i }));

    await waitFor(() => expect(screen.getByTestId("status")).toHaveTextContent("not-installed"));
    expect(screen.getByTestId("error")).toHaveTextContent("Freighter is not installed.");
  });
});
