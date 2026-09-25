import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import EscrowCreateForm from "@/components/escrow/EscrowCreateForm";

vi.mock("@/lib/api", () => ({
  createEscrow: vi.fn().mockResolvedValue({
    url: "https://trustlink.test/pay/escrow-123",
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("EscrowCreateForm", () => {
  it("renders form fields with default initial values", () => {
    render(<EscrowCreateForm />);

    expect(screen.getByLabelText(/item name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/price \(usdc\)/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/shipping window/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /create escrow link/i })
    ).toBeInTheDocument();
  });

  it("applies custom className and pre-populates initialValues", () => {
    const { container } = render(
      <EscrowCreateForm
        className="custom-test-class"
        initialValues={{
          itemName: "Mechanical Keyboard",
          priceUSDC: "150.00",
        }}
      />
    );

    expect(container.firstChild).toHaveClass("custom-test-class");
    expect(screen.getByLabelText(/item name/i)).toHaveValue(
      "Mechanical Keyboard"
    );
    expect(screen.getByLabelText(/price \(usdc\)/i)).toHaveValue("150.00");
  });

  it("updates field values on user input", async () => {
    const user = userEvent.setup();
    render(<EscrowCreateForm />);

    const itemInput = screen.getByLabelText(/item name/i);
    await user.type(itemInput, "Vintage Camera");
    expect(itemInput).toHaveValue("Vintage Camera");
  });
});
