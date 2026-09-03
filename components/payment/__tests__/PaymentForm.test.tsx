import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterAll, beforeAll, beforeEach, describe, expect, it, type Mock, vi } from "vitest";

import useWallet from "@/hooks/useWallet";
import { patchBuyerContact } from "@/lib/api";
import { signTransaction } from "@/lib/stellar/freighter";
import { EscrowStatusConst } from "@/types";

import type { PaymentFormProps } from "../PaymentForm";

let PaymentForm: React.ComponentType<PaymentFormProps>;

// Mock dependencies
vi.mock("@/hooks/useWallet", () => ({
  default: vi.fn(),
}));

vi.mock("@/lib/stellar/freighter", () => ({
  signTransaction: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  patchBuyerContact: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("react-i18next", () => {
  const translations: Record<string, string> = {
    "payment.title": "Payment Details",
    "payment.item": "Item",
    "payment.platformFee": "Protocol Fee",
    "payment.total": "Total",
    "payment.confirmationTitle": "Payment Confirmed!",
    "payment.txHash": "Transaction Hash",
    "payment.submitting": "Processing payment...",
    "payment.payNow": "Pay with Freighter",
  };
  return {
    useTranslation: () => ({
      t: (key: string) => translations[key] ?? key,
    }),
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("@/lib/explorer", () => ({
  getStellarExpertUrl: vi.fn().mockImplementation((hash: string) => {
    return `https://testnet.stellarexpert.io/contract/${hash}`;
  }),
  getStellarExpertTxUrl: vi.fn().mockImplementation((hash: string) => {
    return `https://testnet.stellarexpert.io/tx/${hash}`;
  }),
}));

vi.mock("@/components/providers/NetworkProvider", () => ({
  useNetwork: vi.fn(() => ({ network: "testnet", isTestnet: true, isMainnet: false, toggleNetwork: vi.fn(), setNetwork: vi.fn() })),
  NetworkProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const defaultProps = {
  escrowId: "123",
  itemName: "Test Item",
  amount: 10,
  protocolFee: 0.5,
  total: 10.5,
  sellerAddress: "GSELLER...",
  escrowContractId: "C123...",
  status: EscrowStatusConst.PENDING,
};

describe("PaymentForm", () => {
  beforeAll(async () => {
    vi.stubEnv("NEXT_PUBLIC_USE_MOCKS", "true");
    const mod = await import("../PaymentForm");
    PaymentForm = mod.default;
  });

  afterAll(() => {
    vi.unstubAllEnvs();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    (useWallet as unknown as Mock).mockReturnValue({ isConnected: true, status: "connected" });
  });

  it("renders payment summary and shows amount/fee/total correctly", () => {
    render(<PaymentForm {...defaultProps} />);

    expect(screen.getByText("Payment Details")).toBeInTheDocument();
    expect(screen.getByText("XLM 10")).toBeInTheDocument();
    expect(screen.getByText("XLM 0.5")).toBeInTheDocument();
    expect(screen.getByText("XLM 10.5")).toBeInTheDocument();
  });

  it("toggles email input when send receipt checkbox is clicked", () => {
    render(<PaymentForm {...defaultProps} />);

    const checkbox = screen.getByRole("checkbox", { name: /Send me a receipt/i });
    expect(checkbox).not.toBeChecked();
    expect(screen.queryByPlaceholderText("you@example.com")).not.toBeInTheDocument();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();

    fireEvent.click(checkbox);
    expect(screen.queryByPlaceholderText("you@example.com")).not.toBeInTheDocument();
  });

  it("validates email when send receipt is checked and email is invalid", async () => {
    render(<PaymentForm {...defaultProps} />);

    const checkbox = screen.getByRole("checkbox", { name: /Send me a receipt/i });
    fireEvent.click(checkbox);

    const emailInput = screen.getByPlaceholderText("you@example.com");
    fireEvent.change(emailInput, { target: { value: "invalid-email" } });

    const payButton = screen.getByRole("button", { name: /Pay with Freighter/i });
    fireEvent.click(payButton);

    expect(await screen.findByText("Enter a valid email address.")).toBeInTheDocument();
    expect(signTransaction).not.toHaveBeenCalled();
  });

  it("calls patchBuyerContact on successful payment when email receipt opt-in is selected", async () => {
    vi.mocked(signTransaction).mockResolvedValue("signed_xdr");

    render(<PaymentForm {...defaultProps} />);

    const checkbox = screen.getByRole("checkbox", { name: /Send me a receipt/i });
    fireEvent.click(checkbox);

    const emailInput = screen.getByPlaceholderText("you@example.com");
    fireEvent.change(emailInput, { target: { value: "buyer@example.com" } });

    const payButton = screen.getByRole("button", { name: /Pay with Freighter/i });
    fireEvent.click(payButton);

    await waitFor(() => {
      expect(patchBuyerContact).toHaveBeenCalledWith("123", {
        email: "buyer@example.com",
        emailReceipt: true,
      });
    }, { timeout: 5000 });
  });

  it("is disabled when wallet is disconnected", () => {
    (useWallet as unknown as Mock).mockReturnValue({ isConnected: false, status: "disconnected" });
    render(<PaymentForm {...defaultProps} />);

    const button = screen.getByRole("button", { name: /Pay with Freighter/i });
    expect(button).toBeDisabled();
    expect(screen.getByText("Connect wallet to continue")).toBeInTheDocument();
  });

  it("shows loading state and prevents duplicate submissions", async () => {
    vi.mocked(signTransaction).mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve("signed_xdr"), 100)));

    render(<PaymentForm {...defaultProps} />);
    const button = screen.getByRole("button", { name: /Pay with Freighter/i });

    fireEvent.click(button);

    // After click, it should change to loading state
    expect(await screen.findByText("Processing payment...")).toBeInTheDocument();
    expect(button).toBeDisabled(); // Prevents duplicate submissions
  });

  it("renders success state with tx hash and explorer link", async () => {
    const onPaymentSuccess = vi.fn();
    vi.mocked(signTransaction).mockResolvedValue("signed_xdr");
    
    // We override Math.random to make the hash predictable for the test
    const originalRandom = Math.random;
    Math.random = () => 0.12345678;

    render(<PaymentForm {...defaultProps} onPaymentSuccess={onPaymentSuccess} />);
    const button = screen.getByRole("button", { name: /Pay with Freighter/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Payment Confirmed!")).toBeInTheDocument();
    }, { timeout: 5000 });

    expect(screen.getByText(/Transaction Hash: 3f7a1f\.\.\.91bc/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View on Stellar Expert/i })).toHaveAttribute(
      "href",
      expect.stringContaining("testnet.stellarexpert.io")
    );
    expect(onPaymentSuccess).toHaveBeenCalled();

    Math.random = originalRandom;
  });

  it("shows error state on failure (wallet rejection)", async () => {
    vi.mocked(signTransaction).mockRejectedValue(new Error("User rejected the transaction"));

    render(<PaymentForm {...defaultProps} />);
    const button = screen.getByRole("button", { name: /Pay with Freighter/i });

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText("Transaction was rejected in wallet")).toBeInTheDocument();
    }, { timeout: 5000 });
    
    expect(toast.error).toHaveBeenCalledWith("Transaction was rejected in wallet");
  });

  it("shows error if escrow is not payable", async () => {
    render(<PaymentForm {...defaultProps} status={EscrowStatusConst.COMPLETED} />);
    const button = screen.getByRole("button", { name: /Pay with Freighter/i });

    fireEvent.click(button);

    expect(screen.getByText("Escrow is no longer payable")).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("Escrow is no longer payable");
    expect(signTransaction).not.toHaveBeenCalled();
  });
});