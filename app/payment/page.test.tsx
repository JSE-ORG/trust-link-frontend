import { render, screen } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PaymentPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("PaymentPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    });
  });

  it("renders breadcrumbs, page heading, payment form, and FAQ content", () => {
    render(<PaymentPage />);

    // Breadcrumb verification
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.getByText("Payment", { selector: "span" })).toBeInTheDocument();

    // Main title
    expect(
      screen.getByRole("heading", { level: 1, name: "Payment" })
    ).toBeInTheDocument();

    // Payment Section Form
    expect(
      screen.getByRole("heading", { level: 2, name: "Open Escrow Payment" })
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("e.g. escrow-123 or /pay/escrow-123")
    ).toBeInTheDocument();

    // FAQ section verification
    expect(
      screen.getByRole("heading", { level: 2, name: "Frequently Asked Questions" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("How does escrow protect my payment?")
    ).toBeInTheDocument();
    expect(
      screen.getByText("What happens if there's a dispute?")
    ).toBeInTheDocument();
    expect(
      screen.getByText("Are there any platform fees?")
    ).toBeInTheDocument();
    expect(
      screen.getByText("How long does the escrow process take?")
    ).toBeInTheDocument();
  });
});
