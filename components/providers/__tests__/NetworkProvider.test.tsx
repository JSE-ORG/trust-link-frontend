import * as StellarSdk from "@stellar/stellar-sdk";
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { NetworkProvider, useNetwork } from "@/components/providers/NetworkProvider";

const STORAGE_KEY = "network.preferred";

function wrapper({ children }: { children: ReactNode }) {
  return <NetworkProvider>{children}</NetworkProvider>;
}

function renderNetwork() {
  return renderHook(() => useNetwork(), { wrapper });
}

beforeEach(() => {
  localStorage.clear();
  vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("NetworkProvider", () => {
  describe("initial network resolution", () => {
    it("defaults to testnet when nothing is stored and the env var is unset", () => {
      const { result } = renderNetwork();

      expect(result.current.network).toBe("testnet");
      expect(result.current.isTestnet).toBe(true);
      expect(result.current.isMainnet).toBe(false);
    });

    it.each(["mainnet", "public"])(
      "resolves mainnet from NEXT_PUBLIC_STELLAR_NETWORK=%s",
      (value) => {
        vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", value);
        const { result } = renderNetwork();

        expect(result.current.network).toBe("mainnet");
        expect(result.current.isMainnet).toBe(true);
        expect(result.current.isTestnet).toBe(false);
      }
    );

    it.each(["testnet", "", "futurenet", "MAINNET"])(
      "treats NEXT_PUBLIC_STELLAR_NETWORK=%j as testnet",
      (value) => {
        vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", value);
        const { result } = renderNetwork();

        expect(result.current.network).toBe("testnet");
      }
    );

    it("prefers a stored mainnet preference over a testnet env var", () => {
      localStorage.setItem(STORAGE_KEY, "mainnet");
      vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "testnet");
      const { result } = renderNetwork();

      expect(result.current.network).toBe("mainnet");
    });

    it("prefers a stored testnet preference over a mainnet env var", () => {
      localStorage.setItem(STORAGE_KEY, "testnet");
      vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "mainnet");
      const { result } = renderNetwork();

      expect(result.current.network).toBe("testnet");
    });

    it.each(["public", "MAINNET", "futurenet", ""])(
      "ignores an unrecognized stored preference %j",
      (stored) => {
        localStorage.setItem(STORAGE_KEY, stored);
        const { result } = renderNetwork();

        expect(result.current.network).toBe("testnet");
      }
    );
  });

  describe("switching network", () => {
    it("toggleNetwork flips testnet <-> mainnet and updates the helper flags", () => {
      const { result } = renderNetwork();

      act(() => result.current.toggleNetwork());
      expect(result.current.network).toBe("mainnet");
      expect(result.current.isMainnet).toBe(true);
      expect(result.current.isTestnet).toBe(false);

      act(() => result.current.toggleNetwork());
      expect(result.current.network).toBe("testnet");
      expect(result.current.isTestnet).toBe(true);
      expect(result.current.isMainnet).toBe(false);
    });

    it("toggleNetwork persists the new network to storage", () => {
      const { result } = renderNetwork();

      act(() => result.current.toggleNetwork());
      expect(localStorage.getItem(STORAGE_KEY)).toBe("mainnet");

      act(() => result.current.toggleNetwork());
      expect(localStorage.getItem(STORAGE_KEY)).toBe("testnet");
    });

    it("setNetwork selects a specific network and persists it", () => {
      const { result } = renderNetwork();

      act(() => result.current.setNetwork("mainnet"));
      expect(result.current.network).toBe("mainnet");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("mainnet");

      act(() => result.current.setNetwork("testnet"));
      expect(result.current.network).toBe("testnet");
      expect(localStorage.getItem(STORAGE_KEY)).toBe("testnet");
    });

    it("restores the persisted network on a later mount", () => {
      const first = renderNetwork();
      act(() => first.result.current.setNetwork("mainnet"));
      first.unmount();

      const second = renderNetwork();
      expect(second.result.current.network).toBe("mainnet");
    });
  });

  describe("network config", () => {
    it("exposes the testnet passphrase, horizon and explorer config", () => {
      const { result } = renderNetwork();

      expect(result.current.config.networkPassphrase).toBe(StellarSdk.Networks.TESTNET);
      expect(result.current.config.horizonUrl).toBe("https://horizon-testnet.stellar.org");
      expect(result.current.config.stellarExpertPrefix).toBe("testnet");
      expect(result.current.config.rpcUrl).toMatch(/^https:\/\//);
    });

    it("swaps to the mainnet passphrase, horizon and explorer config", () => {
      const { result } = renderNetwork();

      act(() => result.current.setNetwork("mainnet"));

      expect(result.current.config.networkPassphrase).toBe(StellarSdk.Networks.PUBLIC);
      expect(result.current.config.horizonUrl).toBe("https://horizon.stellar.org");
      expect(result.current.config.stellarExpertPrefix).toBe("public");
      expect(result.current.config.rpcUrl).toBe("https://soroban.stellar.org");
    });
  });

  describe("useNetwork outside the provider", () => {
    it("throws a descriptive error", () => {
      const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

      expect(() => renderHook(() => useNetwork())).toThrow(
        "useNetwork must be used within a NetworkProvider"
      );

      consoleError.mockRestore();
    });
  });
});
