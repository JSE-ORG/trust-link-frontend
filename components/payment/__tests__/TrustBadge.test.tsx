import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TrustBadge } from "../TrustBadge";
import { NetworkProvider } from "@/components/providers/NetworkProvider";

function renderWithProvider(ui: React.ReactElement) {
  return render(<NetworkProvider>{ui}</NetworkProvider>);
}

// Mock the clipboard API
const mockWriteText = vi.fn();
Object.assign(navigator, {
  clipboard: {
    writeText: mockWriteText,
  },
});

describe("TrustBadge", () => {
  const contractAddress = "CA4HA7X3Y2P3KVZP3R6J3R6J3R6J3R6J3R6J3R6J3R6J3R6J3R6J3R6J";
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    localStorage.clear();
  });

  it("renders the trust copy and shield icon", () => {
    renderWithProvider(<TrustBadge contractAddress={contractAddress} />);
    
    expect(screen.getByText("Funds Protected by Smart Contract")).toBeInTheDocument();
    expect(screen.getByText("Escrow contract automatically handles release")).toBeInTheDocument();
  });

  it("renders the truncated contract address with a tooltip", () => {
    renderWithProvider(<TrustBadge contractAddress={contractAddress} />);
    
    const expectedTruncation = "CA4H...3R6J";
    const addressElement = screen.getByText(expectedTruncation);
    expect(addressElement).toBeInTheDocument();
    expect(addressElement).toHaveAttribute("title", contractAddress);
  });

  it("calls navigator.clipboard.writeText and shows success state", async () => {
    renderWithProvider(<TrustBadge contractAddress={contractAddress} />);
    
    const copyButton = screen.getByLabelText("Copy address");
    fireEvent.click(copyButton);
    
    expect(mockWriteText).toHaveBeenCalledWith(contractAddress);
    
    await waitFor(() => {
      expect(screen.queryByTestId("copy-icon")).not.toBeInTheDocument();
    });
  });

  it("links to correct testnet url", () => {
    vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "testnet");
    renderWithProvider(<TrustBadge contractAddress={contractAddress} />);
    
    const link = screen.getByLabelText("View on Stellar Expert");
    expect(link).toHaveAttribute(
      "href", 
      `https://stellar.expert/explorer/testnet/contract/${contractAddress}`
    );
  });

  it("links to correct mainnet url", () => {
    vi.stubEnv("NEXT_PUBLIC_STELLAR_NETWORK", "mainnet");
    renderWithProvider(<TrustBadge contractAddress={contractAddress} />);
    
    const link = screen.getByLabelText("View on Stellar Expert");
    expect(link).toHaveAttribute(
      "href", 
      `https://stellar.expert/explorer/public/contract/${contractAddress}`
    );
  });

  it("is responsive with standard mobile flex layout classes", () => {
    renderWithProvider(<TrustBadge contractAddress={contractAddress} />);
    
    const container = screen.getByText("Funds Protected by Smart Contract").closest('div');
    expect(container?.className).toContain('flex-col');
    expect(container?.className).toContain('sm:flex-row');
  });
});
