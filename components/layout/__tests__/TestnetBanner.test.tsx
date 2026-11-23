/**
 * Issue #1083 — unit tests for `components/layout/TestnetBanner.tsx`.
 *
 * `NetworkIndicator.test.tsx` already drives this banner through a real
 * `NetworkProvider` with `NEXT_PUBLIC_STELLAR_NETWORK` stubbed, and both of
 * those cases pass on `main`. What that route cannot isolate is the component's
 * own contract: it reads exactly one field of the network state, and it renders
 * nothing at all otherwise. So these cases mock `useNetwork` (as the issue
 * asks) and pin the states around that single condition — including the
 * landmark shape, which no existing test looks at.
 *
 * The dismiss control is deliberately not exercised (out of scope: issue 014);
 * one case below pins its absence so that scope boundary stays visible.
 */

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useNetwork } from "@/components/providers/NetworkProvider";

import TestnetBanner from "../TestnetBanner";

vi.mock("@/components/providers/NetworkProvider", () => ({
  useNetwork: vi.fn(),
}));

type NetworkState = ReturnType<typeof useNetwork>;

/**
 * A complete network state with the three fields a caller cares about swapped.
 * The banner reads `isTestnet` and nothing else, so the rest is filled with
 * inert values rather than a second provider.
 */
function networkState(overrides: Partial<NetworkState>): NetworkState {
  return {
    network: "testnet",
    setNetwork: vi.fn(),
    toggleNetwork: vi.fn(),
    isTestnet: true,
    isMainnet: false,
    config: {
      rpcUrl: "https://soroban-testnet.stellar.org",
      networkPassphrase: "Test SDF Network ; September 2015",
      horizonUrl: "https://horizon-testnet.stellar.org",
      stellarExpertPrefix: "testnet",
    },
    ...overrides,
  };
}

function setNetworkState(state: NetworkState): void {
  vi.mocked(useNetwork).mockReturnValue(state);
}

describe("TestnetBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("on Testnet", () => {
    it("announces that funds have no real value", () => {
      setNetworkState(networkState({ isTestnet: true }));

      render(<TestnetBanner />);

      expect(screen.getByRole("alert")).toHaveTextContent(
        "You are on Testnet — funds have no real value"
      );
    });

    it("puts the warning in an alert landmark and nothing else", () => {
      setNetworkState(networkState({ isTestnet: true }));

      const { container } = render(<TestnetBanner />);

      // One landmark, assertive semantics: an `aria-live="polite"` or a second
      // `role="status"` would let a screen reader defer the money warning.
      expect(screen.getAllByRole("alert")).toHaveLength(1);
      expect(screen.queryByRole("status")).toBeNull();
      expect(container.querySelector('[aria-live="polite"]')).toBeNull();
      expect(container.textContent?.trim()).toBe(
        "You are on Testnet — funds have no real value"
      );
    });

    it("offers no dismiss control (issue 014 owns that behaviour)", () => {
      setNetworkState(networkState({ isTestnet: true }));

      render(<TestnetBanner />);

      expect(screen.queryByRole("button")).toBeNull();
    });

    it("follows the hook, not the build-time network variable", () => {
      // A bundle built for Mainnet can still be told to render the banner by a
      // provider that resolved Testnet from storage — and the reverse. The hook
      // is the only source this component is allowed to read.
      vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "mainnet");
      setNetworkState(networkState({ isTestnet: true }));

      render(<TestnetBanner />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
      vi.unstubAllEnvs();
    });
  });

  describe("off Testnet", () => {
    it("renders nothing on Mainnet", () => {
      setNetworkState(
        networkState({ network: "mainnet", isTestnet: false, isMainnet: true })
      );

      const { container } = render(<TestnetBanner />);

      // Not "no alert" — no wrapper element left behind, either.
      expect(container.firstChild).toBeNull();
      expect(screen.queryByRole("alert")).toBeNull();
    });

    it("renders nothing when only `isTestnet` is false, whatever `isMainnet` says", () => {
      for (const isMainnet of [false, true]) {
        setNetworkState(networkState({ isTestnet: false, isMainnet }));

        const { container } = render(<TestnetBanner />);

        expect(container.firstChild).toBeNull();
      }
    });

    it("ignores the rest of the network state while on Mainnet", () => {
      // A state that still points at testnet endpoints but reports
      // `isTestnet: false` must stay silent: the flag is the whole contract.
      setNetworkState(networkState({ network: "mainnet", isTestnet: false, isMainnet: true }));

      const { container } = render(<TestnetBanner />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("changing network without a remount", () => {
    it("shows the banner on Testnet and removes it on Mainnet", () => {
      setNetworkState(networkState({ isTestnet: true, isMainnet: false }));
      const { container, rerender } = render(<TestnetBanner />);
      expect(screen.getByRole("alert")).toBeInTheDocument();

      setNetworkState(networkState({ network: "mainnet", isTestnet: false, isMainnet: true }));
      rerender(<TestnetBanner />);

      expect(screen.queryByRole("alert")).toBeNull();
      expect(container.firstChild).toBeNull();
    });

    it("puts the banner back when switching to Testnet again", () => {
      setNetworkState(networkState({ network: "mainnet", isTestnet: false, isMainnet: true }));
      const { rerender } = render(<TestnetBanner />);
      expect(screen.queryByRole("alert")).toBeNull();

      setNetworkState(networkState({ network: "testnet", isTestnet: true, isMainnet: false }));
      rerender(<TestnetBanner />);

      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});
