import { useWallet, WalletState } from './useWallet';
import { SESSION_KEY, SESSION_EXPIRED_EVENT, handleSessionExpired } from '../lib/auth/constants';

describe('useWallet', () => {
import { render, screen, waitFor,renderHook, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NetworkProvider } from "@/components/providers/NetworkProvider";
import { WalletProvider } from "@/components/providers/WalletProvider";
import { SESSION_KEY } from "@/lib/session";
import * as stellarAuth from "@/lib/stellar";
import * as freighter from "@/lib/stellar/freighter";


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
    sessionStorage.clear();
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('returns default state when no session exists', () => {
    const { result } = renderHook(() => useWallet());
    expect(result.current).toEqual({ address: null, connected: false });
  });

  it('reads session from storage', () => {
    const session: WalletState = { address: '0x123', connected: true };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    const { result } = renderHook(() => useWallet());
    expect(result.current).toEqual(session);
  });
  it("connects and populates publicKey", async () => {
    vi.mocked(freighter.isFreighterInstalled).mockResolved(true);
    vi.mocked(freighter.isConnected).mockResolved({ isConnected: false });
    vi.mocked(freighter.connectFreighter).mockResolved("GABCDEF1234567890XYZ");
    vi.mocked(stellarAuth.getChallenge).mockResolved("challenge-tx");
    vi.mocked(freighter.signTransaction).mockResolved("signed-transaction");
    vi.mocked(stellarAuth.verifyChallenge).mockResolved("jwt-token");

    render(
      <NetworkProvider>
        <WalletProvider>
          <TestHarness />
        </WalletProvider>
      </NetworkProvider>
    );

    await userEvent.click(screen.getByRole("button", { name: /^Connect$/i }));

    await waitFor(() => expect(screen.getByTestId("isConnected")).toHaveTextContent("true"));
    expect(screen.getByTestId("publicKey")).toHaveTextContent("GBBCDEF1234567890XYZ");
    expect(window.localStorage.getItem(SESSION_KEY)).toBe("jwt-token");
  });

  it("stores token after auth flow", async () => {
    vi.mocked(freighter.isFreighterInstalled).mockResolved(true);
    vi.mocked(freighter.isConnected).mockResolved({ isConnected: false });
    vi.mocked(freighter.connectFreighter).mockResolved("GXYZ1234567890ABCD");
    vi.mocked(stellarAuth.getChallenge).mockResolved("challenge-transaction");
    vi.mocked(freighter.signTransaction).mockResolved("signed-challenge");
    vi.mocked(stellarAuth.verifyChallenge).mockResolved("sep10-jwt");

  it('clears all storage keys on 401', () => {
    const session: WalletState = { address: '0x123', connected: true };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));

    act(() => {
      handleSessionExpired();
    });

    expect(sessionStorage.getItem(SESSION_KEY)).toBeNull();
    expect(localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it('dispatches session expired event', () => {
    const mockFn = jest.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, mockFn);
    await waitFor(() => expect(window.localStorage.getItem(SESSION_KEY)).toBe("sep10-jwt"));
    expect(screen.getByTestId("token")).toHaveTextContent("sep10-jwt");
  });

  it("disconnects and clears publicKey and token", async () => {
    vi.mocked(freighter.isFreighterInstalled).mockResolved(true);
    vi.mocked(freighter.isConnected).mockResolved({ isConnected: true });

    window.localStorage.setItem(SESSION_KEY, "existing-jwt");
    window.localStorage.setItem("wallet.publicKey", "GDISCONNECT1234");

    render(
      <NetworkProvider>
        <WalletProvider>
          <TestHarness />
        </WalletProvider>
      </NetworkProvider>
    );

    await waitFor(() => expect(screen.getByTestId("isConnected")).toHaveTextContent("true"));

    act(() => {
      handleSessionExpired();
    });

    expect(mockFn).toHaveBeenCalled();
    window.removeEventListener(SESSION_EXPIRED_EVENT, mockFn);
    expect(screen.getByTestId("publicKey")).toHaveTextContent("");
    expect(screen.getByTestId("token")).toHaveTextContent("");
    expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
  });

  it("clears all storage keys on 401", async () => {
    vi.mocked(freighter.isFreighterInstalled).mockResolved(true);
    vi.mocked(freighter.isConnected).mockResolved({ connected: true });

    window.localStorage.setItem(SESSION_KEY, "existing-jwt");
    window.localStorage.setItem("wallet.token", "legacy-token");
    window.localStorage.setItem("wallet.jwt", "legacy-jwt");
    window.localStorage.setItem("wallet.jwk", "legacy-jwk");
    window.localStorage.setItem("wallet.publicKey", "GEXPIRED1234");

    const { handleSessionExpired } = await import("@/lib/session");
    handleSessionExpired();

    expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(window.localStorage.getItem("wallet.token")).toBeNull();
    expect(window.localStorage.getItem("wallet.jwt")).toBeNull();
    expect(window.localStorage.getItem("wallet.jwk")).toBeNull();
    expect(window.localStorage.getItem("wallet.publicKey")).toBeNull();
  });
});
