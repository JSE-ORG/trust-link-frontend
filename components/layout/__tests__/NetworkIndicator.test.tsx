import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Navbar from "../Navbar";
import TestnetBanner from "../TestnetBanner";
import { NetworkProvider } from "@/components/providers/NetworkProvider";

function renderWithProvider(ui: React.ReactElement) {
  return render(<NetworkProvider>{ui}</NetworkProvider>);
}

describe("Network Components", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    localStorage.clear();
  });

  describe("Navbar Network Indicator", () => {
    it("renders Testnet indicator and toggle when env is testnet", () => {
      vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "testnet");
      renderWithProvider(<Navbar />);
      expect(screen.getByLabelText("Switch to Mainnet")).toBeInTheDocument();
      expect(screen.getByText("Testnet")).toBeInTheDocument();
    });

    it("renders Mainnet indicator and toggle when env is mainnet", () => {
      vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "mainnet");
      renderWithProvider(<Navbar />);
      expect(screen.getByLabelText("Switch to Testnet")).toBeInTheDocument();
      expect(screen.getByText("Mainnet")).toBeInTheDocument();
    });
    
    it("renders Mainnet indicator and toggle when env is public", () => {
      vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "public");
      renderWithProvider(<Navbar />);
      expect(screen.getByLabelText("Switch to Testnet")).toBeInTheDocument();
      expect(screen.getByText("Mainnet")).toBeInTheDocument();
    });
  });

  describe("TestnetBanner", () => {
    it("renders banner message when on Testnet", () => {
      vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "testnet");
      renderWithProvider(<TestnetBanner />);
      expect(screen.getByRole("alert")).toHaveTextContent("You are on Testnet — funds have no real value");
    });

    it("does not render banner on Mainnet", () => {
      vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "mainnet");
      const { container } = renderWithProvider(<TestnetBanner />);
      expect(container.firstChild).toBeNull();
    });
  });
});
