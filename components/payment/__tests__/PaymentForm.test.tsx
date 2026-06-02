import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import PaymentForm from "../PaymentForm";
import useWallet from "@/hooks/useWallet";
import { submitPayment } from "@/lib/stellar/contract";

// Mock the hooks and lib functions
vi.mock("@/hooks/useWallet");
vi.mock("@/lib/stellar/contract");

describe("PaymentForm Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders disabled button when wallet is not connected", () => {
    (useWallet as any).mockReturnValue({
      status: "disconnected",
      publicKey: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
    });

    render(<PaymentForm />);
    
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(screen.getByText(/Connect Wallet to Pay/i)).toBeInTheDocument();
    expect(screen.getByText(/Wallet connection required/i)).toBeInTheDocument();
  });

  it("renders enabled button when wallet is connected", () => {
    (useWallet as any).mockReturnValue({
      status: "connected",
      publicKey: "GABC...",
      connect: vi.fn(),
      disconnect: vi.fn(),
    });

    render(<PaymentForm />);
    
    const button = screen.getByRole("button");
    expect(button).toBeEnabled();
    expect(screen.getByText(/Complete Payment/i)).toBeInTheDocument();
  });

  it("shows loading spinner and disables button during submission", async () => {
    (useWallet as any).mockReturnValue({
      status: "connected",
      publicKey: "GABC...",
    });

    // Make submitPayment stay in pending state
    (submitPayment as any).mockReturnValue(new Promise(() => {}));

    render(<PaymentForm />);
    
    const button = screen.getByRole("button");
    fireEvent.click(button);

    // Check for loading state (form handle logic sets loading=true)
    // We expect the button to be disabled and have a spinner (Loader2 has data-testid if we added it, but we can check for svg or just text if it changed)
    // In our implementation, text doesn't show when loading, only spinner.
    expect(button).toBeDisabled();
    // Lucide components don't have easy text content, but we can check for the svg or aria-busy if we added it.
    // Let's assume the button has no text when loading as per our code: {loading ? <Loader2... /> : <span>...</span>}
    expect(screen.queryByText(/Complete Payment/i)).not.toBeInTheDocument();
  });

  it("renders transaction hash on success", async () => {
    (useWallet as any).mockReturnValue({
      status: "connected",
      publicKey: "GABC...",
    });

    const mockHash = "test_hash_12345";
    (submitPayment as any).mockResolvedValue(mockHash);

    render(<PaymentForm />);
    
    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(/Payment Confirmed/i)).toBeInTheDocument();
      expect(screen.getByText(mockHash)).toBeInTheDocument();
    });
    
    // Button should be disabled after success
    expect(button).toBeDisabled();
  });

  it("renders human-readable error message on failure", async () => {
    (useWallet as any).mockReturnValue({
      status: "connected",
      publicKey: "GABC...",
    });

    const errorMessage = "Insufficient XLM balance";
    (submitPayment as any).mockRejectedValue(new Error(errorMessage));

    render(<PaymentForm />);
    
    const button = screen.getByRole("button");
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
    
    // Button should be re-enabled to allow retry
    expect(button).toBeEnabled();
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
    (useWallet as any).mockReturnValue({ status: "connected" });
  });

  it("renders payment summary and shows amount/fee/total correctly", () => {
    render(<PaymentForm {...defaultProps} />);

    expect(screen.getByText("Payment Details")).toBeInTheDocument();
    expect(screen.getByText("XLM 10")).toBeInTheDocument();
    expect(screen.getByText("XLM 0.5")).toBeInTheDocument();
    expect(screen.getByText("XLM 10.5")).toBeInTheDocument();
  });

  it("is disabled when wallet is disconnected", () => {
    (useWallet as any).mockReturnValue({ status: "disconnected" });
    render(<PaymentForm {...defaultProps} />);

    const button = screen.getByRole("button", { name: /Pay with Freighter/i });
    expect(button).toBeDisabled();
    expect(screen.getByText("Connect wallet to continue")).toBeInTheDocument();
  });

  it("shows loading state and prevents duplicate submissions", async () => {
    vi.useFakeTimers();
    (signTransaction as any).mockResolvedValue("signed_xdr");

    render(<PaymentForm {...defaultProps} />);
    const button = screen.getByRole("button", { name: /Pay with Freighter/i });

    fireEvent.click(button);

    // After click, it should change to loading state
    expect(await screen.findByText("Processing payment...")).toBeInTheDocument();
    expect(button).toBeDisabled(); // Prevents duplicate submissions

    // Fast forward through network delays
    await vi.runAllTimersAsync();
    
    vi.useRealTimers();
  });

  it("renders success state with tx hash and explorer link", async () => {
    vi.useFakeTimers();
    const mockTxHash = "3f7a1234567891bc";
    const onPaymentSuccess = vi.fn();
    (signTransaction as any).mockResolvedValue("signed_xdr");
    
    // We override Math.random to make the hash predictable for the test
    const originalRandom = Math.random;
    Math.random = () => 0.12345678;

    render(<PaymentForm {...defaultProps} onPaymentSuccess={onPaymentSuccess} />);
    const button = screen.getByRole("button", { name: /Pay with Freighter/i });

    fireEvent.click(button);
    await vi.runAllTimersAsync();

    expect(screen.getByText("Payment successful")).toBeInTheDocument();
    // 3f7a1f9a22...91bc
    expect(screen.getByText(/Transaction: 3f7a1f/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View on Stellar Expert/i })).toHaveAttribute(
      "href",
      expect.stringContaining("testnet.stellarexpert.io")
    );
    expect(onPaymentSuccess).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Payment successful");

    Math.random = originalRandom;
    vi.useRealTimers();
  });

  it("shows error state on failure (wallet rejection)", async () => {
    vi.useFakeTimers();
    (signTransaction as any).mockRejectedValue(new Error("User rejected the transaction"));

    render(<PaymentForm {...defaultProps} />);
    const button = screen.getByRole("button", { name: /Pay with Freighter/i });

    fireEvent.click(button);
    await vi.runAllTimersAsync();

    expect(await screen.findByText("Transaction was rejected in wallet")).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("Transaction was rejected in wallet");
    
    vi.useRealTimers();
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
