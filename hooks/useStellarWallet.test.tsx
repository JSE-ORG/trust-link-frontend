import { act, renderHook } from "@testing-library/react";
import { jwtDecode } from "jwt-decode";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NetworkProvider } from "@/components/providers/NetworkProvider";
import { setLoggerUser } from "@/lib/logger";
import {
  MIN_SESSION_REFRESH_DELAY_MS,
  PUBLIC_KEY_STORAGE_KEY,
  SESSION_KEY,
  SESSION_REFRESH_LEAD_MS,
} from "@/lib/session";
import * as stellar from "@/lib/stellar";
import * as freighter from "@/lib/stellar/freighter";

import { useStellarWallet } from "./useStellarWallet";

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

// Partial mock: only the two logger entry points the hook uses, so the logger
// identity can be asserted without stubbing out Sentry wholesale.
vi.mock("@/lib/logger", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/logger")>();
  return { ...actual, setLoggerUser: vi.fn(), captureError: vi.fn() };
});

const TOKEN_STORAGE_KEY = SESSION_KEY;
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

function renderWallet() {
  return renderHook(() => useStellarWallet(), { wrapper: NetworkProvider });
}

beforeEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
  vi.mocked(jwtDecode).mockImplementation(() => ({
    exp: Date.now() / 1000 + 3600,
  }));
});

describe("useStellarWallet identity rollback", () => {
  it("leaves no public key, token or persisted credentials when authentication is rejected", async () => {
    mockWorkingWallet();
    vi.mocked(freighter.signTransaction).mockRejectedValue(
      new Error("User declined the signature"),
    );

    const { result } = renderWallet();
    let connected: boolean | undefined;
    await act(async () => {
      connected = await result.current.connect();
    });

    expect(connected).toBe(false);
    // The hook commits the public key before the challenge is verified, so the
    // rejection has to undo it rather than leaving a half-connected wallet.
    expect(result.current.publicKey).toBeNull();
    expect(result.current.token).toBeNull();
    expect(window.localStorage.getItem(PUBLIC_KEY_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(vi.mocked(setLoggerUser).mock.calls.at(-1)).toEqual([null]);
    // Retryable: the reason survives the rollback.
    expect(result.current.error).toBe("User declined the signature");
  });

  it("recovers on a later successful connection without a reload", async () => {
    mockWorkingWallet();
    vi.mocked(freighter.signTransaction).mockRejectedValueOnce(
      new Error("User declined the signature"),
    );

    const { result } = renderWallet();
    await act(async () => {
      await result.current.connect();
    });
    expect(result.current.publicKey).toBeNull();

    let connected: boolean | undefined;
    await act(async () => {
      connected = await result.current.connect();
    });

    expect(connected).toBe(true);
    expect(result.current.publicKey).toBe(PUBLIC_KEY);
    expect(result.current.token).toBe("jwt-token");
    expect(result.current.error).toBeNull();
    expect(window.localStorage.getItem(PUBLIC_KEY_STORAGE_KEY)).toBe(PUBLIC_KEY);
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBe("jwt-token");
    expect(vi.mocked(setLoggerUser).mock.calls.at(-1)).toEqual([PUBLIC_KEY]);
  });

  it("rolls back a restored session whose re-authentication fails", async () => {
    mockWorkingWallet();
    window.localStorage.setItem(PUBLIC_KEY_STORAGE_KEY, PUBLIC_KEY);
    vi.mocked(stellar.getChallenge).mockRejectedValue(new Error("challenge failed"));

    const { result } = renderWallet();
    await act(async () => {});

    expect(result.current.publicKey).toBeNull();
    expect(result.current.token).toBeNull();
    expect(window.localStorage.getItem(PUBLIC_KEY_STORAGE_KEY)).toBeNull();
    expect(vi.mocked(setLoggerUser).mock.calls.at(-1)).toEqual([null]);
  });
});

describe("useStellarWallet session refresh", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function connect() {
    const rendered = renderWallet();
    await act(async () => {
      await rendered.result.current.connect();
    });
    return rendered;
  }

  it("renews a normal-lifetime token one lead period before it expires", async () => {
    mockWorkingWallet();
    const lifetimeMs = 60 * 60 * 1000;
    vi.mocked(jwtDecode).mockImplementation(() => ({
      exp: (Date.now() + lifetimeMs) / 1000,
    }));

    await connect();
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

    await connect();
    expect(stellar.getChallenge).toHaveBeenCalledTimes(1);

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

    const { result } = await connect();
    await act(async () => {
      vi.advanceTimersByTime(60 * 60 * 1000);
    });

    // One challenge for the connect itself, and nothing scheduled after it.
    expect(stellar.getChallenge).toHaveBeenCalledTimes(1);
    expect(result.current.publicKey).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.error).toBe("Session expired. Reconnect your wallet.");
    expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
    expect(window.localStorage.getItem(PUBLIC_KEY_STORAGE_KEY)).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("ends disconnected when the token cannot be decoded at all", async () => {
    mockWorkingWallet();
    vi.mocked(jwtDecode).mockImplementation(() => {
      throw new Error("Invalid token specified");
    });

    const { result } = await connect();
    await act(async () => {
      vi.advanceTimersByTime(0);
    });

    expect(result.current.token).toBeNull();
    expect(result.current.error).toBe("Session expired. Reconnect your wallet.");
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

      const { result } = await connect();
      expect(result.current.token).toBe("jwt-token");

      vi.mocked(stellar.getChallenge).mockRejectedValue(new Error("challenge failed"));
      await act(async () => {
        vi.advanceTimersByTime(MIN_SESSION_REFRESH_DELAY_MS);
      });

      expect(result.current.token).toBeNull();
      expect(result.current.publicKey).toBeNull();
      expect(result.current.error).toBe("Session expired. Reconnect your wallet.");
      expect(window.localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull();
      expect(window.localStorage.getItem(PUBLIC_KEY_STORAGE_KEY)).toBeNull();
      expect(vi.getTimerCount()).toBe(0);
      expect(unhandled).not.toHaveBeenCalled();
    } finally {
      process.off("unhandledRejection", unhandled);
    }
  });

  it("cancels the scheduled renewal on unmount", async () => {
    mockWorkingWallet();

    const { unmount } = await connect();
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
