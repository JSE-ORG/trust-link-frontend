import { vi, describe, it, expect, beforeEach } from "vitest";

const mockCapture = vi.fn();
const mockIdentify = vi.fn();
const mockReset = vi.fn();
const mockInit = vi.fn();
const mockOptOut = vi.fn();

vi.mock("posthog-js", () => ({
  default: {
    init: mockInit,
    capture: mockCapture,
    identify: mockIdentify,
    reset: mockReset,
    opt_out_capturing: mockOptOut,
  },
}));

describe("analytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    // Restore a browser-like environment for most tests
    delete (globalThis as Record<string, unknown>).window;
    (globalThis as Record<string, unknown>).window = globalThis;
    delete process.env.NEXT_PUBLIC_POSTHOG_DISABLED;
    process.env.NEXT_PUBLIC_POSTHOG_KEY = "phc_test_key";
  });

  describe("isDisabled — no-op conditions", () => {
    it("does nothing when NEXT_PUBLIC_POSTHOG_KEY is not set", async () => {
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const { track } = await import("../analytics");
      await track("link_created");
      expect(mockCapture).not.toHaveBeenCalled();
    });

    it("does nothing when NEXT_PUBLIC_POSTHOG_DISABLED is 'true'", async () => {
      process.env.NEXT_PUBLIC_POSTHOG_DISABLED = "true";
      const { track } = await import("../analytics");
      await track("payment_initiated");
      expect(mockCapture).not.toHaveBeenCalled();
    });

    it("does nothing when window is undefined (SSR)", async () => {
      // Simulate SSR: remove the window global
      (globalThis as Record<string, unknown>).window = undefined;
      const { track } = await import("../analytics");
      await track("link_created");
      expect(mockCapture).not.toHaveBeenCalled();
    });
  });

  describe("track", () => {
    it("calls posthog.capture with the event name", async () => {
      vi.resetModules();
      const { track } = await import("../analytics");
      await track("link_created");
      expect(mockCapture).toHaveBeenCalledWith("link_created", undefined);
    });

    it("passes optional properties to posthog.capture", async () => {
      vi.resetModules();
      const { track } = await import("../analytics");
      await track("payment_completed", { amount: 100, currency: "USDC" });
      expect(mockCapture).toHaveBeenCalledWith("payment_completed", {
        amount: 100,
        currency: "USDC",
      });
    });

    it("initializes posthog only once across multiple track calls", async () => {
      vi.resetModules();
      const { track } = await import("../analytics");
      await track("link_created");
      await track("link_copied");
      expect(mockInit).toHaveBeenCalledTimes(1);
      expect(mockCapture).toHaveBeenCalledTimes(2);
    });

    it("does not throw when posthog.capture throws — errors are silenced", async () => {
      vi.resetModules();
      mockCapture.mockImplementationOnce(() => {
        throw new Error("PostHog unavailable");
      });
      const { track } = await import("../analytics");
      await expect(track("dispute_raised")).resolves.toBeUndefined();
    });
  });

  describe("identify", () => {
    it("calls posthog.identify with the distinct ID", async () => {
      vi.resetModules();
      const { identify } = await import("../analytics");
      await identify("wallet-abc123");
      expect(mockIdentify).toHaveBeenCalledWith("wallet-abc123");
    });

    it("does nothing when analytics is disabled", async () => {
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const { identify } = await import("../analytics");
      await identify("wallet-xyz");
      expect(mockIdentify).not.toHaveBeenCalled();
    });

    it("does not throw when posthog.identify throws — errors are silenced", async () => {
      vi.resetModules();
      mockIdentify.mockImplementationOnce(() => {
        throw new Error("identify failed");
      });
      const { identify } = await import("../analytics");
      await expect(identify("wallet-abc")).resolves.toBeUndefined();
    });
  });

  describe("resetAnalytics", () => {
    it("calls posthog.reset", async () => {
      vi.resetModules();
      const { resetAnalytics } = await import("../analytics");
      await resetAnalytics();
      expect(mockReset).toHaveBeenCalledTimes(1);
    });

    it("does nothing when analytics is disabled", async () => {
      delete process.env.NEXT_PUBLIC_POSTHOG_KEY;
      const { resetAnalytics } = await import("../analytics");
      await resetAnalytics();
      expect(mockReset).not.toHaveBeenCalled();
    });

    it("does not throw when posthog.reset throws — errors are silenced", async () => {
      vi.resetModules();
      mockReset.mockImplementationOnce(() => {
        throw new Error("reset failed");
      });
      const { resetAnalytics } = await import("../analytics");
      await expect(resetAnalytics()).resolves.toBeUndefined();
    });
  });

  describe("posthog.init options", () => {
    it("initializes with autocapture and pageview capture disabled", async () => {
      vi.resetModules();
      const { track } = await import("../analytics");
      await track("qr_code_downloaded");
      expect(mockInit).toHaveBeenCalledWith(
        "phc_test_key",
        expect.objectContaining({
          autocapture: false,
          capture_pageview: false,
          capture_pageleave: false,
        })
      );
    });

    it("initializes with privacy-respecting settings", async () => {
      vi.resetModules();
      const { track } = await import("../analytics");
      await track("link_share_attempt");
      expect(mockInit).toHaveBeenCalledWith(
        "phc_test_key",
        expect.objectContaining({
          respect_dnt: true,
          disable_session_recording: true,
          persistence: "localStorage",
        })
      );
    });
  });
});
