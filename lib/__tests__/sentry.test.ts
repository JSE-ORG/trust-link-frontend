import * as Sentry from "@sentry/nextjs";
import { beforeEach,describe, expect, it, vi } from "vitest";

import {
  captureError,
  captureWalletError,
  setEscrowContext,
  setLoggerUser,
} from "../logger";

// Mock Sentry
vi.mock("@sentry/nextjs", () => {
  return {
    init: vi.fn(),
    setTag: vi.fn(),
    setContext: vi.fn(),
    captureException: vi.fn(),
    captureMessage: vi.fn(),
    addBreadcrumb: vi.fn(),
    setUser: vi.fn(),
    browserTracingIntegration: vi.fn().mockReturnValue({}),
    replayIntegration: vi.fn().mockReturnValue({}),
  };
});

/** Shape the logger passes as Sentry's capture context — narrowed for assertions. */
type CapturedOptions = {
  user?: { id?: string };
  tags?: Record<string, string>;
  contexts?: Record<string, Record<string, unknown>>;
  extra?: Record<string, unknown>;
};

function lastCapture(): [unknown, CapturedOptions | undefined] {
  const calls = vi.mocked(Sentry.captureException).mock.calls;
  const call = calls[calls.length - 1];
  return [call?.[0], call?.[1] as CapturedOptions | undefined];
}

describe("Sentry Error Monitoring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setLoggerUser(null);
    window.localStorage.clear();
  });

  describe("Initialization & Error Filtering", () => {
    it("respects environment variables and filters User Rejection", async () => {
      // Simulate DSN in environment
      process.env.NEXT_PUBLIC_SENTRY_DSN = "https://fake@sentry.io/123";

      // Isolate module to re-trigger initialization
      vi.resetModules();
      await import("../../sentry.client.config");

      expect(Sentry.init).toHaveBeenCalledTimes(1);
      const initArgs = vi.mocked(Sentry.init).mock.calls[0][0];

      // Verify DSN loaded and Initialization occurs once
      expect(initArgs?.dsn).toBe("https://fake@sentry.io/123");

      // Verify Error Filtering
      const beforeSend = initArgs?.beforeSend;
      expect(beforeSend).toBeDefined();

      if (beforeSend) {
        // User Rejection: Ignored (returns null)
        const rejectedHint = { originalException: new Error("User rejected the request") };
        expect(beforeSend({} as never, rejectedHint as never)).toBeNull();

        // Unexpected Error: Captured (returns event)
        const unexpectedHint = { originalException: new Error("Network timeout") };
        const mockEvent = { event_id: "test" };
        expect(beforeSend(mockEvent as never, unexpectedHint as never)).toBe(mockEvent);
      }
    });
  });

  describe("Escrow Context Tests", () => {
    it("setEscrowContext adds the escrow.id tag", () => {
      setEscrowContext("escrow-456");
      expect(Sentry.setTag).toHaveBeenCalledWith("escrow.id", "escrow-456");
      expect(Sentry.setContext).toHaveBeenCalledWith("escrow", { escrowId: "escrow-456" });
    });
  });

  describe("Wallet Error & Transaction Context Tests", () => {
    it("captureWalletError attaches context correctly", () => {
      const mockError = new Error("Failed to sign");
      const mockContext = {
        xdr: "AAAA...",
        contractId: "C123",
        network: "TESTNET"
      };

      captureWalletError(mockError, mockContext);

      expect(Sentry.captureException).toHaveBeenCalledWith(
        mockError,
        expect.objectContaining({
          contexts: { transaction: mockContext },
          tags: expect.objectContaining({ scope: "wallet" }),
        })
      );
    });

    it("captureWalletError promotes the action key to a tag", () => {
      captureWalletError(new Error("Rejected"), { action: "signTransaction" });

      const [, options] = lastCapture();
      expect(options?.tags).toMatchObject({ scope: "wallet", action: "signTransaction" });
    });
  });

  describe("Contextual logger (issue #424)", () => {
    it("attaches the connected wallet as the Sentry user", () => {
      setLoggerUser("GWALLET123");
      expect(Sentry.setUser).toHaveBeenCalledWith({ id: "GWALLET123" });

      captureError(new Error("boom"), { scope: "api", action: "getEscrow" });

      const [, options] = lastCapture();
      expect(options?.user).toEqual({ id: "GWALLET123" });
      expect(options?.tags).toMatchObject({ scope: "api", action: "getEscrow" });
    });

    it("falls back to the persisted wallet address outside React", () => {
      window.localStorage.setItem("wallet.publicKey", "GSTORED456");

      captureError(new Error("boom"));

      const [, options] = lastCapture();
      expect(options?.user).toEqual({ id: "GSTORED456" });
    });

    it("omits the user when no wallet is connected", () => {
      captureError(new Error("boom"));

      const [, options] = lastCapture();
      expect(options?.user).toBeUndefined();
      expect(options?.tags).toMatchObject({ scope: "unknown" });
    });

    it("normalizes non-Error throwables so Sentry can group them", () => {
      captureError("plain string failure", { scope: "escrow", escrowId: "esc_9" });

      const [captured, options] = lastCapture();
      expect(captured).toBeInstanceOf(Error);
      expect((captured as Error).message).toBe("plain string failure");
      expect(options?.tags).toMatchObject({ scope: "escrow", "escrow.id": "esc_9" });
    });

    it("clears the Sentry user on disconnect", () => {
      setLoggerUser(null);
      expect(Sentry.setUser).toHaveBeenCalledWith(null);
    });
  });
});
