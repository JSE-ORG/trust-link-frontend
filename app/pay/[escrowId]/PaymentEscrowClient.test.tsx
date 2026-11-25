import { StrKey } from "@stellar/stellar-sdk";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildFundingTransactionXdr, submitTransaction } from "@/components/payment/PaymentForm";
import { patchBuyerContact } from "@/lib/api";
import i18n from "@/lib/i18n";
import { connectFreighter, isFreighterInstalled, signTransaction } from "@/lib/stellar/freighter";
import type { Escrow } from "@/types";
import { EscrowStatusConst } from "@/types";

import { PaymentEscrowClient } from "./PaymentEscrowClient";

const { connect, publicKey } = vi.hoisted(() => ({
  connect: vi.fn().mockResolvedValue(true),
  publicKey: "GBTESTPUBLICKEYXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
}));

vi.mock("@/hooks/useWallet", () => ({
  default: () => ({ connect, isLoading: false, publicKey }),
}));

vi.mock("@/components/providers/NetworkProvider", () => ({
  useNetwork: () => ({
    network: "testnet",
    isTestnet: true,
    isMainnet: false,
    toggleNetwork: vi.fn(),
    setNetwork: vi.fn(),
    config: {
      rpcUrl: "https://soroban-testnet.stellar.org",
      networkPassphrase: "Test SDF Network ; September 2015",
      horizonUrl: "https://horizon-testnet.stellar.org",
      stellarExpertPrefix: "testnet",
    },
  }),
  NetworkProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/lib/api", () => ({
  patchBuyerContact: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/stellar/freighter", () => ({
  connectFreighter: vi.fn().mockResolvedValue("GBTESTPUBLICKEYXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"),
  isFreighterInstalled: vi.fn().mockResolvedValue(true),
  signTransaction: vi.fn().mockResolvedValue("SIGNED_XDR_MOCK"),
}));

vi.mock("@/components/payment/PaymentForm", () => ({
  buildFundingTransactionXdr: vi.fn().mockResolvedValue("RAW_XDR_MOCK"),
  submitTransaction: vi.fn().mockResolvedValue("mock_tx_hash_123456"),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

const baseEscrow: Escrow = {
  id: "escrow-1",
  vendorId: "GVENDORADDRESSXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  amount: 100,
  item: "Vintage Camera",
  status: EscrowStatusConst.PENDING,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  history: [],
};

describe("PaymentEscrowClient i18n", () => {
  beforeEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  afterEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("renders English copy by default", () => {
    render(<PaymentEscrowClient escrow={baseEscrow} escrowId="escrow-1" />);

    expect(screen.getByText("Complete Payment")).toBeInTheDocument();
    expect(screen.getByText("Pay Now")).toBeInTheDocument();
    expect(screen.getByText("Order Details")).toBeInTheDocument();
  });

  it("switches to French without remounting when the active language changes", async () => {
    render(<PaymentEscrowClient escrow={baseEscrow} escrowId="escrow-1" />);
    expect(screen.getByText("Complete Payment")).toBeInTheDocument();

    await act(async () => {
      await i18n.changeLanguage("fr");
    });

    expect(screen.getByText("Finaliser le paiement")).toBeInTheDocument();
    expect(screen.getByText("Payer maintenant")).toBeInTheDocument();
    expect(screen.getByText("Détails de la commande")).toBeInTheDocument();
    expect(screen.queryByText("Complete Payment")).not.toBeInTheDocument();
  });
});


describe("PaymentEscrowClient payment eligibility", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("en");
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  const guidance = {
    PENDING: null,
    FUNDED: "payment.alreadyFunded",
    SHIPPED: "payment.alreadyShipped",
    COMPLETED: "payment.alreadyCompleted",
    RELEASED: "payment.alreadyReleased",
    REFUNDED: "payment.alreadyRefunded",
    DISPUTED: "payment.alreadyDisputed",
    EXPIRED: "payment.expiredMessage",
  };

  it("saves contact details and routes into the escrow funding pipeline", async () => {
    // The funding transaction needs a valid contract id; the escrow supplies one.
    const contractAddress = StrKey.encodeContract(Buffer.alloc(32, 1));
    render(
      <PaymentEscrowClient escrow={{ ...baseEscrow, contractAddress }} escrowId={baseEscrow.id} />
    );

    fireEvent.change(screen.getByLabelText(/Email address/), {
      target: { value: "buyer@example.com" },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Pay Now" }));
    });

    expect(patchBuyerContact).toHaveBeenCalledWith("escrow-1", {
      email: "buyer@example.com",
      emailReceipt: true,
    });

    // Pay Now runs the whole pipeline: wallet, build, sign, submit.
    expect(isFreighterInstalled).toHaveBeenCalledOnce();
    expect(connectFreighter).toHaveBeenCalled();
    expect(connect).toHaveBeenCalledOnce();
    expect(buildFundingTransactionXdr).toHaveBeenCalledWith(
      expect.objectContaining({
        escrowId: "escrow-1",
        escrowContractId: contractAddress,
        sourceAccount: publicKey,
        network: "TESTNET",
      })
    );
    expect(signTransaction).toHaveBeenCalledWith("RAW_XDR_MOCK", "Test SDF Network ; September 2015");
    expect(submitTransaction).toHaveBeenCalledWith(
      "SIGNED_XDR_MOCK",
      "https://soroban-testnet.stellar.org",
      "Test SDF Network ; September 2015"
    );
    expect(screen.getByText(/mock_tx_hash_123456/)).toBeInTheDocument();
  });

  it.each(Object.values(EscrowStatusConst))(
    "only enables payment for pending escrows: %s",
    async (status) => {
      render(
        <PaymentEscrowClient
          escrow={{ ...baseEscrow, status, expiresAt: new Date(Date.now() + 60_000).toISOString() }}
          escrowId={baseEscrow.id}
        />
      );
      const button = screen.getByRole("button", { name: "Pay Now" });
      if (status === EscrowStatusConst.PENDING) {
        expect(button).toBeEnabled();
        fireEvent.change(screen.getByLabelText(/Email address/), {
          target: { value: "buyer@example.com" },
        });
        await act(async () => { fireEvent.click(button); });
        expect(patchBuyerContact).toHaveBeenCalledOnce();
        // A pending escrow goes on to the wallet step.
        expect(isFreighterInstalled).toHaveBeenCalledOnce();
        expect(connectFreighter).toHaveBeenCalled();
      } else {
        expect(button).toBeDisabled();
        expect(screen.getByText(i18n.t(guidance[status]!))).toBeInTheDocument();
        expect(screen.queryByLabelText(/Email address/)).not.toBeInTheDocument();
        if (status !== EscrowStatusConst.EXPIRED) {
          expect(screen.queryByTestId("escrow-countdown")).not.toBeInTheDocument();
        }

        // Invoke React's registered handler directly to verify its guard even
        // when an invocation bypasses the browser's disabled-button protection.
        const propsKey = Object.keys(button).find((key) => key.startsWith("__reactProps$"));
        expect(propsKey).toBeDefined();
        const props = (button as unknown as Record<string, { onClick: () => Promise<void> }>)[propsKey!];
        await act(async () => { await props.onClick(); });
        expect(patchBuyerContact).not.toHaveBeenCalled();
        expect(isFreighterInstalled).not.toHaveBeenCalled();
        expect(connectFreighter).not.toHaveBeenCalled();
        expect(connect).not.toHaveBeenCalled();
      }
    }
  );

  it("disables payment when a pending escrow expires while open", () => {
    vi.useFakeTimers();
    render(
      <PaymentEscrowClient
        escrow={{ ...baseEscrow, expiresAt: new Date(Date.now() + 1_000).toISOString() }}
        escrowId={baseEscrow.id}
      />
    );
    expect(screen.getByRole("button", { name: "Pay Now" })).toBeEnabled();
    act(() => { vi.advanceTimersByTime(1_000); });
    expect(screen.getByRole("button", { name: "Pay Now" })).toBeDisabled();
    expect(screen.getByText(i18n.t("payment.expiredMessage"))).toBeInTheDocument();
    expect(patchBuyerContact).not.toHaveBeenCalled();
    expect(isFreighterInstalled).not.toHaveBeenCalled();
    expect(connectFreighter).not.toHaveBeenCalled();
        expect(connect).not.toHaveBeenCalled();
  });

  it("blocks an expired deadline before the next countdown tick", async () => {
    vi.useFakeTimers();
    const now = Date.now();
    render(
      <PaymentEscrowClient
        escrow={{ ...baseEscrow, expiresAt: new Date(now + 500).toISOString() }}
        escrowId={baseEscrow.id}
      />
    );
    fireEvent.change(screen.getByLabelText(/Email address/), {
      target: { value: "buyer@example.com" },
    });
    vi.setSystemTime(now + 500);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Pay Now" }));
    });
    expect(screen.getByRole("button", { name: "Pay Now" })).toBeDisabled();
    expect(patchBuyerContact).not.toHaveBeenCalled();
    expect(isFreighterInstalled).not.toHaveBeenCalled();
    expect(connectFreighter).not.toHaveBeenCalled();
        expect(connect).not.toHaveBeenCalled();
  });

  it("blocks an escrow whose deadline has already passed on load", () => {
    render(
      <PaymentEscrowClient
        escrow={{ ...baseEscrow, expiresAt: new Date(Date.now() - 1_000).toISOString() }}
        escrowId={baseEscrow.id}
      />
    );
    expect(screen.getByRole("button", { name: "Pay Now" })).toBeDisabled();
    expect(screen.getByText(i18n.t("payment.expiredMessage"))).toBeInTheDocument();
  });
});


describe("PaymentEscrowClient contract address", () => {
  const escrowAddress = StrKey.encodeContract(Buffer.alloc(32, 1));
  const fallbackAddress = StrKey.encodeContract(Buffer.alloc(32, 2));

  beforeEach(async () => { await i18n.changeLanguage("en"); });
  afterEach(() => { cleanup(); vi.unstubAllEnvs(); });

  it.each([
    { address: escrowAddress, fallback: fallbackAddress, expected: escrowAddress },
    { address: undefined, fallback: fallbackAddress, expected: fallbackAddress },
    { address: "record-id", fallback: fallbackAddress, expected: fallbackAddress },
    { address: ` ${escrowAddress} `, fallback: "", expected: escrowAddress },
    { address: escrowAddress, fallback: undefined, expected: escrowAddress },
    { address: undefined, fallback: undefined, expected: null },
    { address: "record-id", fallback: "invalid", expected: null },
    { address: " ", fallback: " ", expected: null },
    { address: escrowAddress.slice(0, -1), fallback: "", expected: null },
  ])("uses the first valid contract address: %j", ({ address, fallback, expected }) => {
    vi.stubEnv("NEXT_PUBLIC_CONTRACT_ID", fallback);
    render(<PaymentEscrowClient escrow={{ ...baseEscrow, contractAddress: address }} escrowId={baseEscrow.id} />);
    if (expected) {
      expect(screen.getByTitle(expected)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "View on Stellar Expert" })).toHaveAttribute(
        "href", `https://stellar.expert/explorer/testnet/contract/${expected}`
      );
      expect(screen.queryByText(i18n.t("payment.contractUnavailable"))).not.toBeInTheDocument();
    } else {
      expect(screen.getByText(i18n.t("payment.contractUnavailable"))).toBeInTheDocument();
      expect(screen.queryByRole("link", { name: "View on Stellar Expert" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Copy address" })).not.toBeInTheDocument();
      expect(screen.queryByText("Funds Protected by Smart Contract")).not.toBeInTheDocument();
      expect(screen.queryByTitle(baseEscrow.id)).not.toBeInTheDocument();
    }
  });

  describe("contact validation accessibility", () => {
    it("explains contact alternatives without labeling both fields required", () => {
      render(<PaymentEscrowClient escrow={baseEscrow} escrowId="escrow-1" />);

      const emailInput = screen.getByLabelText(/Email address/);
      const phoneInput = screen.getByLabelText(/Phone number/);

      expect(emailInput).toHaveAttribute("aria-required", "false");
      expect(phoneInput).toHaveAttribute("aria-required", "false");
      expect(screen.getByText("Provide at least one contact method to receive shipping and delivery notifications.")).toBeInTheDocument();
    });

    it("announces base error and focuses email when both contact fields are blank on submit", async () => {
      render(<PaymentEscrowClient escrow={baseEscrow} escrowId="escrow-1" />);

      const payButton = screen.getByRole("button", { name: "Pay Now" });
      fireEvent.click(payButton);

      const emailInput = screen.getByLabelText(/Email address/);
      expect(emailInput).toHaveFocus();
      expect(emailInput).toHaveAttribute("aria-invalid", "true");

      const baseError = screen.getByText("Please provide at least one contact method.");
      expect(baseError).toHaveAttribute("role", "alert");
    });

    it("focuses phone input when invalid phone format is provided with valid email", async () => {
      render(<PaymentEscrowClient escrow={baseEscrow} escrowId="escrow-1" />);

      const emailInput = screen.getByLabelText(/Email address/);
      const phoneInput = screen.getByLabelText(/Phone number/);

      fireEvent.change(emailInput, { target: { value: "buyer@example.com" } });
      fireEvent.change(phoneInput, { target: { value: "invalid-phone" } });

      const payButton = screen.getByRole("button", { name: "Pay Now" });
      fireEvent.click(payButton);

      expect(phoneInput).toHaveFocus();
      expect(phoneInput).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByText("Enter a valid phone number in E.164 format (e.g. +12125551234).")).toHaveAttribute("role", "alert");
    });
  });
});
