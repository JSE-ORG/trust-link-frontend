import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Navbar from "../Navbar";
import TestnetBanner from "../TestnetBanner";

describe("Network Components", () => {
  describe("Navbar Network Indicator", () => {
    it("renders Testnet indicator when NEXT_PUBLIC_STELLAR_NETWORK is testnet", () => {
      vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "testnet");
      render(<Navbar />);
      expect(screen.getByLabelText("Connected to Testnet")).toBeInTheDocument();
      expect(screen.getByText("Testnet")).toBeInTheDocument();
    });

    it("renders Mainnet indicator when NEXT_PUBLIC_STELLAR_NETWORK is mainnet", () => {
      vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "mainnet");
      render(<Navbar />);
      expect(screen.getByLabelText("Connected to Mainnet")).toBeInTheDocument();
      expect(screen.getByText("Mainnet")).toBeInTheDocument();
    });
    
    it("renders Mainnet indicator when NEXT_PUBLIC_STELLAR_NETWORK is public", () => {
      vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "public");
      render(<Navbar />);
      expect(screen.getByLabelText("Connected to Mainnet")).toBeInTheDocument();
      expect(screen.getByText("Mainnet")).toBeInTheDocument();
    });
  });

  describe("TestnetBanner", () => {
    it("renders banner message when on Testnet", () => {
      vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "testnet");
      render(<TestnetBanner />);
      expect(screen.getByRole("alert")).toHaveTextContent("You are on Testnet — funds have no real value");
    });

    it("does not render banner on Mainnet", () => {
      vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "mainnet");
      const { container } = render(<TestnetBanner />);
      expect(container.firstChild).toBeNull();
    });
  });
});
