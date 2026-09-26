import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";
import type { Escrow } from "@/types";
import { EscrowStatusConst } from "@/types";

import { PaymentEscrowClient } from "./PaymentEscrowClient";

vi.mock("@/hooks/useWallet", () => ({
  default: () => ({ connect: vi.fn().mockResolvedValue(true), isLoading: false }),
}));

vi.mock("@/components/providers/NetworkProvider", () => ({
  useNetwork: () => ({ network: "testnet", isTestnet: true, isMainnet: false, toggleNetwork: vi.fn(), setNetwork: vi.fn() }),
  NetworkProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("@/lib/api", () => ({
  patchBuyerContact: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/stellar/freighter", () => ({
  connectFreighter: vi.fn(),
  isFreighterInstalled: vi.fn().mockResolvedValue(true),
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
