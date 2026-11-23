/**
 * Issue #1082 — unit tests for `lib/logger.ts` and the Sentry payload it builds.
 *
 * `lib/__tests__/sentry.test.ts` already reaches into this module for the parts
 * of issue #424 it happened to cover (a connected wallet, a persisted address, a
 * non-Error throwable, disconnect). This file is the complete pass the issue
 * asks for: every exported function, and the two things that are easy to break
 * silently — which context keys are *omitted* versus sent empty, and which
 * wallet address wins when two disagree.
 *
 * Mocking note: the issue names `setTags`, but this module writes single keys
 * (`Sentry.setTag`) and a section (`Sentry.setContext`). `setTags` is mocked so
 * the module surface matches the issue's list; no assertion is made against it,
 * because `logger.ts` never calls it.
 */

import * as Sentry from "@sentry/nextjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

import logger, {
  addBreadcrumb,
  captureError,
  captureMessage,
  captureWalletError,
  redactTransactionContext,
  setEscrowContext,
  setLoggerUser,
} from "../logger";

vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(() => "event-id-from-sentry"),
  captureMessage: vi.fn(() => "message-event-id"),
  setUser: vi.fn(),
  setTags: vi.fn(),
  setTag: vi.fn(),
  setContext: vi.fn(),
  addBreadcrumb: vi.fn(),
}));

/** The scope payload `buildScopeContext` hands to Sentry's capture calls. */
type CaptureOptions = {
  user?: { id?: string };
  level?: string;
  tags?: Record<string, string>;
  contexts?: Record<string, Record<string, unknown>>;
  extra?: Record<string, unknown>;
};

/** Everything the module may put on the *wire* for one capture call. */
const WALLET = "GABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const STORED = "GSTOREDADDRESSXXXXXXXXXXXXXXXXXXXXX";

function captureExceptionCall(index = 0): [unknown, CaptureOptions | undefined] {
  const calls = vi.mocked(Sentry.captureException).mock.calls;
  const call = calls[index];
  if (!call) throw new Error(`expected captureException call ${index}, got ${calls.length}`);
  return [call[0], call[1] as CaptureOptions | undefined];
}

function captureMessageCall(index = 0): [string, CaptureOptions | undefined] {
  const calls = vi.mocked(Sentry.captureMessage).mock.calls;
  const call = calls[index];
  if (!call) throw new Error(`expected captureMessage call ${index}, got ${calls.length}`);
  return [call[0], call[1] as CaptureOptions | undefined];
}

/** The single tag set for the last captured exception. */
function lastTags(): Record<string, string> {
  const [, options] = captureExceptionCall();
  return options?.tags ?? {};
}

describe("lib/logger", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // `currentUserId` is module scope, so a previous test's wallet would leak
    // into the next one's expected payload without this reset.
    setLoggerUser(null);
    vi.mocked(Sentry.captureException).mockReturnValue("event-id-from-sentry");
  });

  describe("setLoggerUser", () => {
    it("records the wallet on the logger and on the Sentry scope", () => {
      setLoggerUser(WALLET);

      expect(Sentry.setUser).toHaveBeenCalledWith({ id: WALLET });
    });

    it("clears the Sentry user on disconnect", () => {
      setLoggerUser(WALLET);
      vi.mocked(Sentry.setUser).mockClear();

      setLoggerUser(null);

      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });

    it("treats an empty address as no user at all", () => {
      setLoggerUser(WALLET);
      vi.mocked(Sentry.setUser).mockClear();

      setLoggerUser("");

      expect(Sentry.setUser).toHaveBeenCalledWith(null);
      // …and an empty string is falsy in `resolveUserId`, so the persisted
      // address is consulted again rather than reported as the user.
      localStorage.setItem("wallet.publicKey", STORED);
      captureError(new Error("boom"));
      expect(captureExceptionCall()[1]?.user).toEqual({ id: STORED });
    });

    it("prefers the in-memory wallet over a different persisted address", () => {
      localStorage.setItem("wallet.publicKey", STORED);
      setLoggerUser(WALLET);

      captureError(new Error("boom"));

      expect(captureExceptionCall()[1]?.user).toEqual({ id: WALLET });
    });

    it("recovers the persisted address when nothing is in memory", () => {
      localStorage.setItem("wallet.publicKey", STORED);

      captureError(new Error("boom"));

      expect(captureExceptionCall()[1]?.user).toEqual({ id: STORED });
    });

    it("reports no user once the wallet is disconnected", () => {
      setLoggerUser(WALLET);
      setLoggerUser(null);

      // Nothing is persisted here: this pins that `null` clears the module's
      // own copy instead of leaving the last wallet on every later event.
      captureError(new Error("boom"));

      expect("user" in (captureExceptionCall()[1] ?? {})).toBe(false);
    });
  });

  describe("storage failure", () => {
    it("still reports the error when the address cannot be read", () => {
      const getItem = vi.spyOn(window.localStorage, "getItem").mockImplementation(() => {
        throw new Error("SecurityError: storage disabled");
      });

      expect(() => captureError(new Error("boom"))).not.toThrow();

      expect("user" in (captureExceptionCall()[1] ?? {})).toBe(false);
      expect(Sentry.captureException).toHaveBeenCalledTimes(1);
      getItem.mockRestore();
    });

    it("reports no user before hydration on the server", () => {
      // `resolveUserId` answers from localStorage only when a DOM window exists;
      // a server-rendered capture must still report the error itself.
      vi.stubGlobal("window", undefined);

      try {
        expect(() => captureError(new Error("boom"))).not.toThrow();
        expect("user" in (captureExceptionCall()[1] ?? {})).toBe(false);
      } finally {
        vi.unstubAllGlobals();
      }
    });
  });

  describe("captureError", () => {
    it("returns the Sentry event id", () => {
      expect(captureError(new Error("boom"))).toBe("event-id-from-sentry");
    });

    it("forwards an Error instance unchanged", () => {
      const error = new Error("boom");

      captureError(error, { scope: "api", action: "getEscrow", escrowId: "esc_12" });

      const [thrown, options] = captureExceptionCall();
      expect(thrown).toBe(error);
      expect(options?.tags).toEqual({
        scope: "api",
        action: "getEscrow",
        "escrow.id": "esc_12",
      });
    });

    it("wraps a thrown string in an Error with the same message", () => {
      captureError("wallet rejected the transaction");

      const [thrown] = captureExceptionCall();
      expect(thrown).toBeInstanceOf(Error);
      expect((thrown as Error).message).toBe("wallet rejected the transaction");
    });

    it("serialises a thrown object so it is not reported as [object Object]", () => {
      captureError({ code: 500, detail: "timeout" });

      const [thrown] = captureExceptionCall();
      expect(thrown).toBeInstanceOf(Error);
      expect((thrown as Error).message).toBe('{"code":500,"detail":"timeout"}');
    });

    it("defaults the scope to `unknown` and omits every key not supplied", () => {
      captureError(new Error("boom"));

      const [, options] = captureExceptionCall();
      expect(options?.tags).toEqual({ scope: "unknown" });
      expect("action" in (options?.tags ?? {})).toBe(false);
      expect("escrow.id" in (options?.tags ?? {})).toBe(false);
      expect("contexts" in (options ?? {})).toBe(false);
      expect("extra" in (options ?? {})).toBe(false);
    });

    it("forwards contexts and extra when supplied", () => {
      captureError(new Error("boom"), {
        scope: "escrow",
        contexts: { escrow: { status: "funded" } },
        extra: { attempt: 3 },
      });

      const [, options] = captureExceptionCall();
      expect(options?.contexts).toEqual({ escrow: { status: "funded" } });
      expect(options?.extra).toEqual({ attempt: 3 });
    });

    it("lets a caller tag override the derived scope and action", () => {
      captureError(new Error("boom"), {
        scope: "wallet",
        action: "signTransaction",
        tags: { scope: "wallet.retry", network: "testnet" },
      });

      // The caller's `tags` spread last in `buildScopeContext`, so it wins.
      // Pinned here because the order is what makes a retry tag reachable.
      expect(lastTags()).toEqual({
        scope: "wallet.retry",
        action: "signTransaction",
        network: "testnet",
      });
    });
  });

  describe("captureMessage", () => {
    it("sends a non-exception event at info level by default", () => {
      setLoggerUser(WALLET);

      captureMessage("escrow lookup degraded", { scope: "api", action: "listEscrows" });

      const [message, options] = captureMessageCall();
      expect(message).toBe("escrow lookup degraded");
      expect(options?.level).toBe("info");
      expect(options?.user).toEqual({ id: WALLET });
      expect(options?.tags).toEqual({ scope: "api", action: "listEscrows" });
    });

    it("honours an explicit level and keeps it out of the tags", () => {
      captureMessage("rate limited", { scope: "api", level: "warning" });

      const [, options] = captureMessageCall();
      expect(options?.level).toBe("warning");
      expect("level" in (options?.tags ?? {})).toBe(false);
    });

    it("returns the Sentry event id", () => {
      expect(captureMessage("hello")).toBe("message-event-id");
    });
  });

  describe("setEscrowContext", () => {
    it("writes the dotted tag and the escrow section together", () => {
      setEscrowContext("esc_42");

      expect(Sentry.setTag).toHaveBeenCalledWith("escrow.id", "esc_42");
      expect(Sentry.setContext).toHaveBeenCalledWith("escrow", { escrowId: "esc_42" });
    });
  });

  describe("captureWalletError", () => {
    it("redacts XDR, promotes the action, and scopes the event to the wallet", () => {
      captureWalletError(new Error("signing failed"), {
        action: "signTransaction",
        xdr: "AAAAAAA",
        source: "GACCOUNT",
      });

      const [, options] = captureExceptionCall();
      expect(options?.tags).toEqual({ scope: "wallet", action: "signTransaction" });
      expect(options?.contexts?.transaction).toEqual({
        action: "signTransaction",
        xdr: "[redacted:7]",
        source: "GACCOUNT",
      });
    });

    it("sends no action tag when the payload has no string action", () => {
      captureWalletError(new Error("signing failed"), { xdr: "AAAA", action: 7 });

      expect("action" in lastTags()).toBe(false);
    });
  });

  describe("redactTransactionContext", () => {
    it("keeps only the length of every XDR-shaped key", () => {
      const redacted = redactTransactionContext({
        unsignedXdr: "AAA",
        signedTxXdr: "BBBB",
        memo: "keep me",
      });

      expect(redacted).toEqual({
        unsignedXdr: "[redacted:3]",
        signedTxXdr: "[redacted:4]",
        memo: "keep me",
      });
    });
  });

  describe("addBreadcrumb", () => {
    it("records the message, data and category under the info level", () => {
      addBreadcrumb("opened escrow view", { escrowId: "esc_7" }, "ui");

      expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
        category: "ui",
        message: "opened escrow view",
        data: { escrowId: "esc_7" },
        level: "info",
      });
    });

    it("defaults the category to `unknown`", () => {
      addBreadcrumb("something happened");

      const args = vi.mocked(Sentry.addBreadcrumb).mock.calls[0]?.[0];
      expect(args?.category).toBe("unknown");
      expect(args?.level).toBe("info");
    });
  });

  describe("the logger facade", () => {
    it("exposes each function under its documented name", () => {
      // The default export is what callers import; a rename here breaks every
      // call site silently, which no per-function test would notice.
      expect(logger).toEqual({
        setUser: setLoggerUser,
        setEscrowContext,
        error: captureError,
        message: captureMessage,
        walletError: captureWalletError,
        redact: redactTransactionContext,
        breadcrumb: addBreadcrumb,
      });
    });
  });
});
