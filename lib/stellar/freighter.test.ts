import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  isFreighterInstalled,
  connectFreighter,
  signTransaction,
  isConnected,
  // getPublicKey,
} from "./freighter";

// Mock @stellar/freighter-api
const mockIsConnected = vi.fn();
const mockGetPublicKey = vi.fn();
const mockFreighterSignTransaction = vi.fn();
const mockIsAllowed = vi.fn();
const mockSetAllowed = vi.fn();

vi.mock("@stellar/freighter-api", () => ({
  isConnected: mockIsConnected,
  getPublicKey: mockGetPublicKey,
  signTransaction: mockFreighterSignTransaction,
  isAllowed: mockIsAllowed,
  setAllowed: mockSetAllowed,
}));

describe("lib/stellar/freighter.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window.freighter
    delete (window as any).freighter;
  });

  describe("isFreighterInstalled", () => {
    it("returns true when Freighter is installed", async () => {
      (window as any).freighter = {};
      const result = await isFreighterInstalled();
      expect(result).toBe(true);
    });

    it("returns false when Freighter is not installed", async () => {
      const result = await isFreighterInstalled();
      expect(result).toBe(false);
    });
  });

  describe("connectFreighter", () => {
    it("connects successfully when Freighter is installed and allowed", async () => {
      (window as any).freighter = {};
      mockIsAllowed.mockResolvedValue(true);
      mockGetPublicKey.mockResolvedValue("GD1234567890");

      const result = await connectFreighter();
      expect(result).toBe("GD1234567890");
      expect(mockIsAllowed).toHaveBeenCalled();
      expect(mockGetPublicKey).toHaveBeenCalled();
      expect(mockSetAllowed).not.toHaveBeenCalled();
    });

    it("requests permission when not allowed and then connects", async () => {
      (window as any).freighter = {};
      mockIsAllowed.mockResolvedValue(false);
      mockSetAllowed.mockResolvedValue(undefined);
      mockGetPublicKey.mockResolvedValue("GD1234567890");

      const result = await connectFreighter();
      expect(result).toBe("GD1234567890");
      expect(mockIsAllowed).toHaveBeenCalled();
      expect(mockSetAllowed).toHaveBeenCalled();
      expect(mockGetPublicKey).toHaveBeenCalled();
    });

    it("throws error when Freighter is not installed", async () => {
      await expect(connectFreighter()).rejects.toThrow("Freighter not installed");
    });

    it("throws error when getPublicKey returns null", async () => {
      (window as any).freighter = {};
      mockIsAllowed.mockResolvedValue(true);
      mockGetPublicKey.mockResolvedValue(null);

      await expect(connectFreighter()).rejects.toThrow("Failed to get public key from Freighter");
    });

    it("throws error when getPublicKey returns undefined", async () => {
      (window as any).freighter = {};
      mockIsAllowed.mockResolvedValue(true);
      mockGetPublicKey.mockResolvedValue(undefined);

      await expect(connectFreighter()).rejects.toThrow("Failed to get public key from Freighter");
    });

    it("throws error when getPublicKey returns empty string", async () => {
      (window as any).freighter = {};
      mockIsAllowed.mockResolvedValue(true);
      mockGetPublicKey.mockResolvedValue("");

      await expect(connectFreighter()).rejects.toThrow("Failed to get public key from Freighter");
    });
  });

  describe("signTransaction", () => {
    it("signs transaction successfully on PUBLIC network", async () => {
      (window as any).freighter = {};
      mockFreighterSignTransaction.mockResolvedValue({
        signedTransaction: "signed-xdr-string",
        error: null,
      });

      const result = await signTransaction("unsigned-xdr", "PUBLIC");
      expect(result).toBe("signed-xdr-string");
      expect(mockFreighterSignTransaction).toHaveBeenCalledWith({
        xdr: "unsigned-xdr",
        network: "PUBLIC",
      });
    });

    it("signs transaction successfully on TESTNET network", async () => {
      (window as any).freighter = {};
      mockFreighterSignTransaction.mockResolvedValue({
        signedTransaction: "signed-xdr-string",
        error: null,
      });

      const result = await signTransaction("unsigned-xdr", "TESTNET");
      expect(result).toBe("signed-xdr-string");
      expect(mockFreighterSignTransaction).toHaveBeenCalledWith({
        xdr: "unsigned-xdr",
        network: "TESTNET",
      });
    });

    it("throws error when Freighter is not installed", async () => {
      await expect(signTransaction("xdr", "PUBLIC")).rejects.toThrow(
        "Freighter not installed"
      );
    });

    it("throws error when Freighter returns an error", async () => {
      (window as any).freighter = {};
      mockFreighterSignTransaction.mockResolvedValue({
        signedTransaction: null,
        error: "User rejected transaction",
      });

      await expect(signTransaction("xdr", "PUBLIC")).rejects.toThrow(
        "User rejected transaction"
      );
    });

    it("throws error when signedTransaction is null", async () => {
      (window as any).freighter = {};
      mockFreighterSignTransaction.mockResolvedValue({
        signedTransaction: null,
        error: null,
      });

      await expect(signTransaction("xdr", "PUBLIC")).rejects.toThrow(
        "Failed to sign transaction"
      );
    });

    it("throws error when signedTransaction is undefined", async () => {
      (window as any).freighter = {};
      mockFreighterSignTransaction.mockResolvedValue({
        signedTransaction: undefined,
        error: null,
      });

      await expect(signTransaction("xdr", "PUBLIC")).rejects.toThrow(
        "Failed to sign transaction"
      );
    });

    it("handles custom network string", async () => {
      (window as any).freighter = {};
      mockFreighterSignTransaction.mockResolvedValue({
        signedTransaction: "signed-xdr-string",
        error: null,
      });

      const result = await signTransaction("unsigned-xdr", "CUSTOM_NETWORK");
      expect(result).toBe("signed-xdr-string");
      expect(mockFreighterSignTransaction).toHaveBeenCalledWith({
        xdr: "unsigned-xdr",
        network: "CUSTOM_NETWORK",
      });
    });
  });

  describe("re-exported functions", () => {
    it("re-exports isConnected from @stellar/freighter-api", () => {
      expect(isConnected).toBeDefined();
    });

    // it("re-exports getPublicKey from @stellar/freighter-api", () => {
    //   expect(getPublicKey).toBeDefined();
    // });
  });

  describe("integration scenarios", () => {
    it("handles complete connect and sign workflow", async () => {
      (window as any).freighter = {};
      mockIsAllowed.mockResolvedValue(true);
      mockGetPublicKey.mockResolvedValue("GD1234567890");
      mockFreighterSignTransaction.mockResolvedValue({
        signedTransaction: "signed-xdr",
        error: null,
      });

      // Connect
      const publicKey = await connectFreighter();
      expect(publicKey).toBe("GD1234567890");

      // Sign transaction
      const signedXdr = await signTransaction("unsigned-xdr", "TESTNET");
      expect(signedXdr).toBe("signed-xdr");
    });

    it("handles workflow requiring permission request", async () => {
      (window as any).freighter = {};
      mockIsAllowed.mockResolvedValue(false);
      mockSetAllowed.mockResolvedValue(undefined);
      mockGetPublicKey.mockResolvedValue("GD9876543210");

      const publicKey = await connectFreighter();
      expect(publicKey).toBe("GD9876543210");
      expect(mockSetAllowed).toHaveBeenCalled();
    });
  });
});
