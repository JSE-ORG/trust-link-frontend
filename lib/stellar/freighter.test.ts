import { Networks } from "@stellar/stellar-sdk";
import { beforeEach,describe, expect, it, vi } from "vitest";

import {
  connectFreighter,
  isConnected,
  isFreighterInstalled,
  isValidNetworkPassphrase,
  resolveNetworkPassphrase,
  signTransaction,
} from "./freighter";

// Mock @stellar/freighter-api
const { mockIsConnected, mockGetAddress, mockFreighterSignTransaction, mockIsAllowed, mockSetAllowed } = vi.hoisted(() => ({
  mockIsConnected: vi.fn(),
  mockGetAddress: vi.fn(),
  mockFreighterSignTransaction: vi.fn(),
  mockIsAllowed: vi.fn(),
  mockSetAllowed: vi.fn(),
}));

vi.mock("@stellar/freighter-api", () => ({
  isConnected: mockIsConnected,
  getAddress: mockGetAddress,
  signTransaction: mockFreighterSignTransaction,
  isAllowed: mockIsAllowed,
  setAllowed: mockSetAllowed,
}));

describe("lib/stellar/freighter.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete (window as Window & { freighter?: Record<string, unknown> }).freighter;
    mockIsConnected.mockResolvedValue({ isConnected: true });
    mockIsAllowed.mockResolvedValue({ isAllowed: true });
  });

  describe("resolveNetworkPassphrase", () => {
    it("maps the PUBLIC network name to the public passphrase", () => {
      expect(resolveNetworkPassphrase("PUBLIC")).toBe(Networks.PUBLIC);
    });

    it("maps the TESTNET network name to the testnet passphrase", () => {
      expect(resolveNetworkPassphrase("TESTNET")).toBe(Networks.TESTNET);
    });

    it("maps lowercase names used by the network provider", () => {
      expect(resolveNetworkPassphrase("mainnet")).toBe(Networks.PUBLIC);
      expect(resolveNetworkPassphrase("testnet")).toBe(Networks.TESTNET);
    });

    it("trims surrounding whitespace", () => {
      expect(resolveNetworkPassphrase("  TESTNET  ")).toBe(Networks.TESTNET);
    });

    it("returns futurenet, sandbox and standalone passphrases", () => {
      expect(resolveNetworkPassphrase("FUTURENET")).toBe(Networks.FUTURENET);
      expect(resolveNetworkPassphrase("SANDBOX")).toBe(Networks.SANDBOX);
      expect(resolveNetworkPassphrase("STANDALONE")).toBe(Networks.STANDALONE);
    });

    it("passes a real custom passphrase through untouched", () => {
      const custom = "My Private Network ; July 2026";

      expect(resolveNetworkPassphrase(custom)).toBe(custom);
    });

    it("never returns a network name in place of a passphrase", () => {
      for (const name of ["PUBLIC", "TESTNET", "mainnet", "testnet"]) {
        expect(resolveNetworkPassphrase(name)).not.toBe(name);
        expect(resolveNetworkPassphrase(name)).toContain(";");
      }
    });

    it("throws for an empty or non-string value", () => {
      expect(() => resolveNetworkPassphrase("")).toThrow(
        "Network passphrase is required"
      );
      expect(() => resolveNetworkPassphrase("   ")).toThrow(
        "Network passphrase is required"
      );
      expect(() =>
        resolveNetworkPassphrase(undefined as unknown as string)
      ).toThrow("Network passphrase is required");
    });
  });

  describe("isValidNetworkPassphrase", () => {
    it("accepts network names and real passphrases", () => {
      expect(isValidNetworkPassphrase("TESTNET")).toBe(true);
      expect(isValidNetworkPassphrase(Networks.PUBLIC)).toBe(true);
    });

    it("rejects empty values", () => {
      expect(isValidNetworkPassphrase("")).toBe(false);
    });
  });

  describe("isFreighterInstalled", () => {
    it("returns true when the Freighter API reports a connection", async () => {
      mockIsConnected.mockResolvedValue({ isConnected: true });

      await expect(isFreighterInstalled()).resolves.toBe(true);
      expect(mockIsConnected).toHaveBeenCalled();
    });

    it("returns false when the extension is not installed", async () => {
      mockIsConnected.mockResolvedValue({ isConnected: false });

      await expect(isFreighterInstalled()).resolves.toBe(false);
    });

    it("returns false when the API call rejects", async () => {
      mockIsConnected.mockRejectedValue(new Error("Freighter API unavailable"));

      await expect(isFreighterInstalled()).resolves.toBe(false);
    });

    it("does not rely on a window.freighter object being present", async () => {
      (window as Window & { freighter?: Record<string, unknown> }).freighter = {};
      mockIsConnected.mockResolvedValue({ isConnected: false });

      await expect(isFreighterInstalled()).resolves.toBe(false);
    });

    it("does not treat the awaited response object as a boolean", async () => {
      // `isConnected()` resolves to an object, which is always truthy.
      mockIsConnected.mockResolvedValue({ isConnected: false });

      const installed = await isFreighterInstalled();

      expect(installed).toBe(false);
      expect(Boolean({ isConnected: false })).toBe(true);
    });
  });

  describe("connectFreighter", () => {
    it("connects successfully when Freighter is installed and allowed", async () => {
      mockGetAddress.mockResolvedValue({ address: "GD1234567890" });

      const result = await connectFreighter();
      expect(result).toBe("GD1234567890");
      expect(mockIsAllowed).toHaveBeenCalled();
      expect(mockGetAddress).toHaveBeenCalled();
      expect(mockSetAllowed).not.toHaveBeenCalled();
    });

    it("requests permission when not allowed and then connects", async () => {
      mockIsAllowed.mockResolvedValue({ isAllowed: false });
      mockSetAllowed.mockResolvedValue(undefined);
      mockGetAddress.mockResolvedValue({ address: "GD1234567890" });

      const result = await connectFreighter();
      expect(result).toBe("GD1234567890");
      expect(mockIsAllowed).toHaveBeenCalled();
      expect(mockSetAllowed).toHaveBeenCalled();
      expect(mockGetAddress).toHaveBeenCalled();
    });

    it("throws error when Freighter is not installed", async () => {
      mockIsConnected.mockResolvedValue({ isConnected: false });

      await expect(connectFreighter()).rejects.toThrow("Freighter not installed");
    });

    it("throws error when getAddress returns null", async () => {
      mockGetAddress.mockResolvedValue(null);

      await expect(connectFreighter()).rejects.toThrow();
    });

    it("throws error when getAddress returns undefined", async () => {
      mockGetAddress.mockResolvedValue(undefined);

      await expect(connectFreighter()).rejects.toThrow();
    });

    it("throws error when getAddress returns an empty address string", async () => {
      mockGetAddress.mockResolvedValue({ address: "" });

      await expect(connectFreighter()).rejects.toThrow("Failed to get public key from Freighter");
    });
  });

  describe("signTransaction", () => {
    it("sends the public passphrase for the PUBLIC network", async () => {
      mockFreighterSignTransaction.mockResolvedValue({
        signedTxXdr: "signed-xdr-string",
      });

      const result = await signTransaction("unsigned-xdr", "PUBLIC");
      expect(result).toBe("signed-xdr-string");
      expect(mockFreighterSignTransaction).toHaveBeenCalledWith(
        "unsigned-xdr",
        { networkPassphrase: Networks.PUBLIC },
      );
    });

    it("sends the testnet passphrase for the TESTNET network", async () => {
      mockFreighterSignTransaction.mockResolvedValue({
        signedTxXdr: "signed-xdr-string",
      });

      const result = await signTransaction("unsigned-xdr", "TESTNET");
      expect(result).toBe("signed-xdr-string");
      expect(mockFreighterSignTransaction).toHaveBeenCalledWith(
        "unsigned-xdr",
        { networkPassphrase: Networks.TESTNET },
      );
      expect(Networks.TESTNET).toBe("Test SDF Network ; September 2015");
    });

    it("never sends the bare network name as the passphrase", async () => {
      mockFreighterSignTransaction.mockResolvedValue({ signedTxXdr: "signed-xdr-string" });

      await signTransaction("unsigned-xdr", "TESTNET");
      await signTransaction("unsigned-xdr", "PUBLIC");

      const options = mockFreighterSignTransaction.mock.calls.map(
        (call) => (call[1] as { networkPassphrase: string }).networkPassphrase
      );
      expect(options).not.toContain("TESTNET");
      expect(options).not.toContain("PUBLIC");
    });

    it("throws before calling Freighter for an empty network", async () => {
      await expect(signTransaction("unsigned-xdr", "")).rejects.toThrow(
        "Network passphrase is required"
      );
      expect(mockFreighterSignTransaction).not.toHaveBeenCalled();
    });

    it("throws error when Freighter is not installed", async () => {
      mockIsConnected.mockResolvedValue({ isConnected: false });

      await expect(signTransaction("xdr", "PUBLIC")).rejects.toThrow(
        "Freighter not installed"
      );
    });

    it("throws error when Freighter returns an error", async () => {
      mockFreighterSignTransaction.mockResolvedValue({
        signedTxXdr: null,
        signerAddress: null,
      });

      await expect(signTransaction("xdr", "PUBLIC")).rejects.toThrow(
        "Failed to sign transaction"
      );
    });

    it("throws error when signedTransaction is null", async () => {
      mockFreighterSignTransaction.mockResolvedValue({
        signedTxXdr: null,
      });

      await expect(signTransaction("xdr", "PUBLIC")).rejects.toThrow(
        "Failed to sign transaction"
      );
    });

    it("throws error when signedTransaction is undefined", async () => {
      mockFreighterSignTransaction.mockResolvedValue({
        signedTxXdr: undefined,
      });

      await expect(signTransaction("xdr", "PUBLIC")).rejects.toThrow(
        "Failed to sign transaction"
      );
    });

    it("handles a custom network passphrase", async () => {
      const customPassphrase = "My Private Network ; July 2026";
      mockFreighterSignTransaction.mockResolvedValue({
        signedTxXdr: "signed-xdr-string",
      });

      const result = await signTransaction("unsigned-xdr", customPassphrase);
      expect(result).toBe("signed-xdr-string");
      expect(mockFreighterSignTransaction).toHaveBeenCalledWith(
        "unsigned-xdr",
        { networkPassphrase: customPassphrase },
      );
    });
  });

  describe("re-exported functions", () => {
    it("re-exports isConnected from @stellar/freighter-api", () => {
      expect(isConnected).toBeDefined();
    });
  });

  describe("integration scenarios", () => {
    it("handles complete connect and sign workflow", async () => {
      mockGetAddress.mockResolvedValue({ address: "GD1234567890" });
      mockFreighterSignTransaction.mockResolvedValue({
        signedTxXdr: "signed-xdr",
      });

      // Connect
      const publicKey = await connectFreighter();
      expect(publicKey).toBe("GD1234567890");

      // Sign transaction
      const signedXdr = await signTransaction("unsigned-xdr", "TESTNET");
      expect(signedXdr).toBe("signed-xdr");
      expect(mockFreighterSignTransaction).toHaveBeenCalledWith(
        "unsigned-xdr",
        { networkPassphrase: Networks.TESTNET },
      );
    });

    it("handles workflow requiring permission request", async () => {
      mockIsAllowed.mockResolvedValue({ isAllowed: false });
      mockSetAllowed.mockResolvedValue(undefined);
      mockGetAddress.mockResolvedValue({ address: "GD9876543210" });

      const publicKey = await connectFreighter();
      expect(publicKey).toBe("GD9876543210");
      expect(mockSetAllowed).toHaveBeenCalled();
    });
  });
});
