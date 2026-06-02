import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import * as Sentry from "@sentry/nextjs";
import { setEscrowContext, captureWalletError } from "../sentry";

// Mock Sentry
vi.mock("@sentry/nextjs", () => {
  return {
    init: vi.fn(),
    setTag: vi.fn(),
    setContext: vi.fn(),
    captureException: vi.fn(),
    setUser: vi.fn(),
  };
});

describe("Sentry Error Monitoring", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
        expect(beforeSend({} as any, rejectedHint as any)).toBeNull();
        
        // Unexpected Error: Captured (returns event)
        const unexpectedHint = { originalException: new Error("Network timeout") };
        const mockEvent = { event_id: "test" };
        expect(beforeSend(mockEvent as any, unexpectedHint as any)).toBe(mockEvent);
      }
    });
  });

  describe("Escrow Context Tests", () => {
    it("setEscrowContext adds the escrow.id tag", () => {
      setEscrowContext("escrow-456");
      expect(Sentry.setTag).toHaveBeenCalledWith("escrow.id", "escrow-456");
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

      expect(Sentry.captureException).toHaveBeenCalledWith(mockError, {
        contexts: {
          transaction: mockContext,
        },
      });
    });
  });
});
