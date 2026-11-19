import { act,render, screen } from "@testing-library/react";
import { jwtDecode } from "jwt-decode";
import { afterEach,beforeEach,describe, expect, it, vi } from "vitest";

import useWallet from "@/hooks/useWallet";
import { setLoggerUser } from "@/lib/logger";
import {
  handleSessionExpired,
  MIN_SESSION_REFRESH_DELAY_MS,
  PUBLIC_KEY_STORAGE_KEY,
  SESSION_EXPIRED_EVENT,
  SESSION_KEY,
  SESSION_REFRESH_LEAD_MS,
} from "@/lib/session";
import * as stellar from "@/lib/stellar";
import * as freighter from "@/lib/stellar/freighter";

import { NetworkProvider } from "./NetworkProvider";
import { WalletProvider } from "./WalletProvider";

vi.mock("@/lib/stellar/freighter", () => ({
  getAddress: vi.fn(),
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

// Partial mock: only the two logger entry points the provider uses, so the
// logger identity can be asserted without stubbing out Sentry wholesale.
vi.mock("@/lib/logger", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/logger")>();
  return { ...actual, setLoggerUser: vi.fn(), captureError: vi.fn() };
});

function TestComponent() {
  const { publicKey, token, connect, isLoading, error } = useWallet();
  return (
    <div>
      <div data-testid="publicKey">{publicKey}</div>
      <div data-testid="token">{token}</div>
      <div data-testid="isLoading">{isLoading.toString()}</div>
      <div data-testid="error">{error?.message ?? ""}</div>
      <button onClick={connect}>Connect</button>
    </div>
  );
}

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <NetworkProvider>
      <WalletProvider>{ui}</WalletProvider>
    </NetworkProvider>
  );
}

describe("WalletProvider SEP-10 Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
  });

  it("completes SEP-10 flow on connect", async () => {
    const mockPubKey = "GABC123";
    const mockChallenge = "challenge-xdr";
    const mockSignedXdr = "signed-xdr";
    const mockToken = "jwt-token";

    vi.mocked(freighter.isFreighterInstalled).mockResolvedValue(true);
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(freighter.connectFreighter).mockResolvedValue(mockPubKey);
    vi.mocked(freighter.getAddress!).mockResolvedValue({ address: mockPubKey });
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
    expect(freighter.signTransaction).toHaveBeenCalledWith(
      mockChallenge,
      expect.stringMatching(/TESTNET|PUBLIC/)
    );
    expect(stellar.verifyChallenge).toHaveBeenCalledWith(mockSignedXdr);
  });

  it("handles errors during authentication", async () => {
    vi.mocked(freighter.isFreighterInstalled).mockResolvedValue(true);
    vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: true });
    vi.mocked(freighter.connectFreighter).mockResolvedValue("GABC123");
    vi.mocked(freighter.getAddress!).mockResolvedValue({ address: "GABC123" });
    vi.mocked(stellar.getChallenge).mockRejectedValue(
      new Error("Challenge failed")
    );

    renderWithProviders(<TestComponent />);

    const connectButton = screen.getByText("Connect");
    await act(async () => {
      connectButton.click();
    });

    expect(screen.getByTestId("error")).toHaveTextContent("Challenge failed");
    expect(screen.getByTestId("token")).toBeEmptyDOMElement();
  });
});

/** Mirrors the harness above, plus the derived `status`. */
function StatusHarness() {
  const { publicKey, token, status, error, connect } = useWallet();
  return (
    <div>
      <div data-testid="publicKey">{publicKey}</div>
      <div data-testid="token">{token}</div>
      <div data-testid="status">{status}</div>
      <div data-testid="error">{error?.message ?? ""}</div>
      <button onClick={connect}>Connect</button>
    </div>
  );
}

const PUBLIC_KEY = "GABC123";

/** Wires up the happy path: installed, allowed, and a verifiable challenge. */
function mockWorkingWallet(jwt = "jwt-token") {
  vi.mocked(freighter.isFreighterInstalled).mockResolvedValue(true);
  vi.mocked(freighter.isConnected).mockResolvedValue({ isConnected: true });
  vi.mocked(freighter.connectFreighter).mockResolvedValue(PUBLIC_KEY);
  vi.mocked(stellar.getChallenge).mockResolvedValue("challenge-xdr");
  vi.mocked(freighter.signTransaction).mockResolvedValue("signed-xdr");
  vi.mocked(stellar.verifyChallenge).mockResolvedValue(jwt);
}

async function clickConnect() {
  await act(async () => {
    screen.getByText("Connect").click();
  });
}

describe("WalletProvider identity rollback", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.mocked(jwtDecode).mockImplementation(() => ({
      exp: Date.now() / 1000 + 3600,
    }));
  });

  it("leaves no public key, token or persisted credentials when authentication is rejected", async () => {
    mockWorkingWallet();
    vi.mocked(freighter.signTransaction).mockRejectedValue(
      new Error("User declined the signature"),
    );

    renderWithProviders(<StatusHarness />);
    await clickConnect();

    // The provider commits the public key before the challenge is verified, so
    // the rejection has to undo it rather than leaving a half-connected wallet.
    expect(screen.getByTestId("publicKey")).toBeEmptyDOMElement();
    expect(screen.getByTestId("token")).toBeEmptyDOMElement();
    expect(window.localStorage.getItem(PUBLIC_KEY_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(vi.mocked(setLoggerUser).mock.calls.at(-1)).toEqual([null]);
    // Retryable: the failure is reported, not swallowed into "connected".
    expect(screen.getByTestId("status")).toHaveTextContent("error");
    expect(screen.getByTestId("error")).toHaveTextContent(
      "User declined the signature",
    );
  });

  it("recovers on a later successful connection without a reload", async () => {
    mockWorkingWallet();
    vi.mocked(freighter.signTransaction).mockRejectedValueOnce(
      new Error("User declined the signature"),
    );

    renderWithProviders(<StatusHarness />);
    await clickConnect();
    expect(screen.getByTestId("publicKey")).toBeEmptyDOMElement();

    await clickConnect();

    expect(screen.getByTestId("publicKey")).toHaveTextContent(PUBLIC_KEY);
    expect(screen.getByTestId("token")).toHaveTextContent("jwt-token");
    expect(screen.getByTestId("status")).toHaveTextContent("connected");
    expect(window.localStorage.getItem(SESSION_KEY)).toBe("jwt-token");
    expect(vi.mocked(setLoggerUser).mock.calls.at(-1)).toEqual([PUBLIC_KEY]);
  });

  it("rolls back a restored session whose re-authentication fails", async () => {
    mockWorkingWallet();
    window.localStorage.setItem(PUBLIC_KEY_STORAGE_KEY, PUBLIC_KEY);
    vi.mocked(stellar.getChallenge).mockRejectedValue(new Error("challenge failed"));

    await act(async () => {
      renderWithProviders(<StatusHarness />);
    });

    expect(screen.getByTestId("publicKey")).toBeEmptyDOMElement();
    expect(screen.getByTestId("token")).toBeEmptyDOMElement();
    expect(window.localStorage.getItem(PUBLIC_KEY_STORAGE_KEY)).toBeNull();
    expect(vi.mocked(setLoggerUser).mock.calls.at(-1)).toEqual([null]);
  });

  it("clears in-memory wallet state once when handleSessionExpired is called", async () => {
    mockWorkingWallet();
    renderWithProviders(<StatusHarness />);
    await clickConnect();
    expect(screen.getByTestId("token")).toHaveTextContent("jwt-token");
    expect(screen.getByTestId("publicKey")).toHaveTextContent(PUBLIC_KEY);

    const onExpired = vi.fn();
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    try {
      act(() => {
        handleSessionExpired();
      });

      expect(onExpired).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId("token")).toBeEmptyDOMElement();
      expect(screen.getByTestId("publicKey")).toBeEmptyDOMElement();
      expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
      expect(window.localStorage.getItem(PUBLIC_KEY_STORAGE_KEY)).toBeNull();
    } finally {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
    }
  });
});

describe("WalletProvider session refresh", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    vi.useFakeTimers();
    vi.mocked(jwtDecode).mockImplementation(() => ({
      exp: Date.now() / 1000 + 3600,
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renews a normal-lifetime token one lead period before it expires", async () => {
    mockWorkingWallet();
    const lifetimeMs = 60 * 60 * 1000;
    vi.mocked(jwtDecode).mockImplementation(() => ({
      exp: (Date.now() + lifetimeMs) / 1000,
    }));

    renderWithProviders(<StatusHarness />);
    await clickConnect();
    expect(stellar.getChallenge).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(lifetimeMs - SESSION_REFRESH_LEAD_MS - 1);
    });
    expect(stellar.getChallenge).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(1);
    });
    expect(stellar.getChallenge).toHaveBeenCalledTimes(2);
  });

  it("spaces out renewals for a short-lived token instead of signing in a loop", async () => {
    mockWorkingWallet();
    // Under a minute left: the old schedule subtracted five minutes, clamped
    // the delay at zero and re-signed immediately — and every replacement
    // token was just as short, so it never stopped.
    vi.mocked(jwtDecode).mockImplementation(() => ({
      exp: (Date.now() + 60_000) / 1000,
    }));
    let issued = 0;
    vi.mocked(stellar.verifyChallenge).mockImplementation(async () => `jwt-${++issued}`);

    renderWithProviders(<StatusHarness />);
    await clickConnect();
    expect(stellar.getChallenge).toHaveBeenCalledTimes(1);

    // Each renewal replaces the token and so reschedules the effect; one
    // renewal per floor period is the bound, rather than an unbroken stream.
    for (let renewals = 1; renewals <= 5; renewals += 1) {
      await act(async () => {
        vi.advanceTimersByTime(MIN_SESSION_REFRESH_DELAY_MS - 1);
      });
      expect(stellar.getChallenge).toHaveBeenCalledTimes(renewals);

      await act(async () => {
        vi.advanceTimersByTime(1);
      });
      expect(stellar.getChallenge).toHaveBeenCalledTimes(renewals + 1);
    }
  });

  it.each([
    ["an already-expired token", () => ({ exp: (Date.now() - 1_000) / 1000 })],
    ["a token expiring exactly now", () => ({ exp: Date.now() / 1000 })],
    ["a missing expiry claim", () => ({})],
    ["a non-numeric expiry claim", () => ({ exp: "later" as unknown as number })],
  ])("ends disconnected for %s rather than re-signing", async (_label, payload) => {
    mockWorkingWallet();
    vi.mocked(jwtDecode).mockImplementation(payload);

    renderWithProviders(<StatusHarness />);
    await clickConnect();

    await act(async () => {
      vi.advanceTimersByTime(60 * 60 * 1000);
    });

    // One challenge for the connect itself, and nothing scheduled after it.
    expect(stellar.getChallenge).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("publicKey")).toBeEmptyDOMElement();
    expect(screen.getByTestId("token")).toBeEmptyDOMElement();
    expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(window.localStorage.getItem(PUBLIC_KEY_STORAGE_KEY)).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("ends disconnected when the token cannot be decoded at all", async () => {
    mockWorkingWallet();
    vi.mocked(jwtDecode).mockImplementation(() => {
      throw new Error("Invalid token specified");
    });

    renderWithProviders(<StatusHarness />);
    await clickConnect();
    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(screen.getByTestId("token")).toBeEmptyDOMElement();
    expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("drops the session when a renewal is rejected, without an unhandled rejection", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    try {
      mockWorkingWallet();
      vi.mocked(jwtDecode).mockImplementation(() => ({
        exp: (Date.now() + 60_000) / 1000,
      }));

      renderWithProviders(<StatusHarness />);
      await clickConnect();
      expect(screen.getByTestId("token")).toHaveTextContent("jwt-token");

      vi.mocked(stellar.getChallenge).mockRejectedValue(new Error("challenge failed"));
      await act(async () => {
        vi.advanceTimersByTime(MIN_SESSION_REFRESH_DELAY_MS);
      });

      expect(screen.getByTestId("token")).toBeEmptyDOMElement();
      expect(screen.getByTestId("publicKey")).toBeEmptyDOMElement();
      expect(window.localStorage.getItem(SESSION_KEY)).toBeNull();
      expect(window.localStorage.getItem(PUBLIC_KEY_STORAGE_KEY)).toBeNull();
      expect(vi.getTimerCount()).toBe(0);
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off("unhandledRejection", unhandled);
    }
  });

  it("cancels the scheduled renewal on unmount", async () => {
    mockWorkingWallet();

    const { unmount } = renderWithProviders(<StatusHarness />);
    await clickConnect();
    expect(stellar.getChallenge).toHaveBeenCalledTimes(1);
    expect(vi.getTimerCount()).toBeGreaterThan(0);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
    await act(async () => {
      vi.advanceTimersByTime(24 * 60 * 60 * 1000);
    });
    expect(stellar.getChallenge).toHaveBeenCalledTimes(1);
  });
});
