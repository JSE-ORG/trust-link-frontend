import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PaymentForm from "../PaymentForm";
import useWallet from "@/hooks/useWallet";
import { signTransaction } from "@/lib/stellar/freighter";
import { toast } from "sonner";

// Mock dependencies
vi.mock("@/hooks/useWallet", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/stellar/freighter", () => ({
  signTransaction: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/explorer", () => ({
  getStellarExpertUrl: vi.fn().mockImplementation((hash, network) => {
    const prefix = network === "mainnet" ? "public" : "testnet";
    return `https://testnet.stellarexpert.io/contract/${hash}`;
  }),
}));

vi.mock("@/components/providers/NetworkProvider", () => ({
  useNetwork: vi.fn(() => ({ network: "testnet", isTestnet: true, isMainnet: false, toggleNetwork: vi.fn(), setNetwork: vi.fn() })),
  NetworkProvider: ({ children }: any) => children,
}));

const defaultProps = {
  escrowId: "123",
  itemName: "Test Item",
  amount: 10,
  protocolFee: 0.5,
  total: 10.5,
  sellerAddress: "GSELLER...",
  escrowContractId: "C123...",
  status: "PENDING",
};

describe("PaymentForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useWallet as any).mockReturnValue({ isConnected: true });
  });

  it("renders payment summary and shows amount/fee/total correctly", () => {
    render(<PaymentForm {...defaultProps} />);

    expect(screen.getByText("Payment Details")).toBeInTheDocument();
    expect(screen.getByText("XLM 10")).toBeInTheDocument();
    expect(screen.getByText("XLM 0.5")).toBeInTheDocument();
    expect(screen.getByText("XLM 10.5")).toBeInTheDocument();
  });

  it("is disabled when wallet is disconnected", () => {
    (useWallet as any).mockReturnValue({ isConnected: false });
    render(<PaymentForm {...defaultProps} />);

    const button = screen.getByRole("button", { name: /Pay with Freighter/i });
    expect(button).toBeDisabled();
    expect(screen.getByText("Connect wallet to continue")).toBeInTheDocument();
  });

  it("shows loading state and prevents duplicate submissions", async () => {
    (signTransaction as any).mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve("signed_xdr"), 100)));

    render(<PaymentForm {...defaultProps} />);
    const button = screen.getByRole("button", { name: /Pay with Freighter/i });

    fireEvent.click(button);

    // After click, it should change to loading state
    expect(await screen.findByText("Processing payment...")).toBeInTheDocument();
    expect(button).toBeDisabled(); // Prevents duplicate submissions
  });

  it("renders success state with tx hash and explorer link", async () => {
    const onPaymentSuccess = vi.fn();
    (signTransaction as any).mockResolvedValue("signed_xdr");
    
    // We override Math.random to make the hash predictable for the test
    const originalRandom = Math.random;
    Math.random = () => 0.12345678;

    render(<PaymentForm {...defaultProps} onPaymentSuccess={onPaymentSuccess} />);
    const button = screen.getByRole("button", { name: /Pay with Freighter/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Payment successful")).toBeInTheDocument();
    }, { timeout: 5000 });

    // The hash generation in PaymentForm.tsx: "3f7a" + Math.random().toString(16).substring(2, 10) + "91bc"
    // With 0.12345678, Math.random().toString(16) is "0.1f9a222a"
    // .substring(2, 10) is "1f9a222a"
    // Result: "3f7a1f9a222a91bc"
    expect(screen.getByText(/Transaction: 3f7a1f9a222a91bc/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View on Stellar Expert/i })).toHaveAttribute(
      "href",
      expect.stringContaining("testnet.stellarexpert.io")
    );
    expect(onPaymentSuccess).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Payment successful");

    Math.random = originalRandom;
  });

  it("shows error state on failure (wallet rejection)", async () => {
    (signTransaction as any).mockRejectedValue(new Error("User rejected the transaction"));

    render(<PaymentForm {...defaultProps} />);
    const button = screen.getByRole("button", { name: /Pay with Freighter/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Transaction was rejected in wallet")).toBeInTheDocument();
    }, { timeout: 5000 });
    
    expect(toast.error).toHaveBeenCalledWith("Transaction was rejected in wallet");
  });

  it("shows error if escrow is not payable", async () => {
    render(<PaymentForm {...defaultProps} status="COMPLETED" />);
    const button = screen.getByRole("button", { name: /Pay with Freighter/i });

    fireEvent.click(button);

    expect(screen.getByText("Escrow is no longer payable")).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("Escrow is no longer payable");
    expect(signTransaction).not.toHaveBeenCalled();
  });
});