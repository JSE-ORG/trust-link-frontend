import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import TestnetBanner from "./TestnetBanner";

vi.mock("@/components/providers/NetworkProvider", () => ({
  useNetwork: vi.fn(),
}));

import { useNetwork } from "@/components/providers/NetworkProvider";

const mockedUseNetwork = vi.mocked(useNetwork);

describe("TestnetBanner", () => {
  it("renders the testnet warning when on testnet", () => {
    mockedUseNetwork.mockReturnValue({
      isTestnet: true,
      isMainnet: false,
      network: "testnet",
      setNetwork: vi.fn(),
      toggleNetwork: vi.fn(),
      config: {
        rpcUrl: "https://soroban-testnet.stellar.org",
        networkPassphrase: "Test SDF Future Network ; September 2015",
        horizonUrl: "https://horizon-testnet.stellar.org",
        stellarExpertPrefix: "testnet",
      },
    });

    render(<TestnetBanner />);
    expect(
      screen.getByText("You are on Testnet — funds have no real value")
    ).toBeInTheDocument();
  });

  it("renders nothing when on mainnet", () => {
    mockedUseNetwork.mockReturnValue({
      isTestnet: false,
      isMainnet: true,
      network: "mainnet",
      setNetwork: vi.fn(),
      toggleNetwork: vi.fn(),
      config: {
        rpcUrl: "https://soroban.stellar.org",
        networkPassphrase: "Public Global Stellar Network ; September 2015",
        horizonUrl: "https://horizon.stellar.org",
        stellarExpertPrefix: "public",
      },
    });

    const { container } = render(<TestnetBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("has the alert role", () => {
    mockedUseNetwork.mockReturnValue({
      isTestnet: true,
      isMainnet: false,
      network: "testnet",
      setNetwork: vi.fn(),
      toggleNetwork: vi.fn(),
      config: {
        rpcUrl: "https://soroban-testnet.stellar.org",
        networkPassphrase: "Test SDF Future Network ; September 2015",
        horizonUrl: "https://horizon-testnet.stellar.org",
        stellarExpertPrefix: "testnet",
      },
    });

    render(<TestnetBanner />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });
});
