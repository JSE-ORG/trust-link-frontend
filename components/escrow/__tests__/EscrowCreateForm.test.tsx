import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";

import { createEscrow } from "@/lib/api";

import EscrowCreateForm from "../EscrowCreateForm";

vi.mock("@/lib/api", () => ({
  createEscrow: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("../ShareModal", () => ({
  default: ({
    isOpen,
    url,
    escrowId,
  }: {
    isOpen: boolean;
    url: string;
    escrowId: string;
  }) =>
    isOpen ? (
      <div data-testid="share-modal">
        {url}
        {escrowId}
      </div>
    ) : null,
}));

const mockCreateEscrow = vi.mocked(createEscrow);

const validValues = {
  itemName: "Awesome Widget",
  priceUSDC: "123.45",
  description: "A **bold** widget",
  shippingWindow: "1-3 days",
} as const;

async function fillRequiredFields(
  user: ReturnType<typeof userEvent.setup>,
  overrides: Partial<{ itemName: string; priceUSDC: string; description: string }> = {}
) {
  const values = { ...validValues, ...overrides };
  await user.type(screen.getByLabelText("Item name"), values.itemName);
  await user.type(screen.getByLabelText("Price (USDC)"), values.priceUSDC);
  await user.type(screen.getByLabelText("Description"), values.description);
}

async function submitForm(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /create escrow link/i }));
}

describe("EscrowCreateForm", () => {
  let consoleError: MockInstance<typeof console.error>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error");
  });

  afterEach(() => {
    // Guards against act() warnings and unexpected React errors leaking into test output.
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
    vi.clearAllMocks();
  });

  describe("rendering", () => {
    it("renders all form fields in their initial state", () => {
      render(<EscrowCreateForm />);

      expect(screen.getByLabelText("Item name")).toHaveValue("");
      // A number input reports an empty value as null.
      expect(screen.getByLabelText("Price (USDC)")).toHaveValue(null);
      expect(screen.getByLabelText("Description")).toHaveValue("");
      expect(screen.getByLabelText("Shipping window")).toHaveValue("Same day");
      expect(
        screen.getByRole("button", { name: /create escrow link/i })
      ).toBeEnabled();
    });

    it("does not render the link card, share modal, or errors initially", () => {
      render(<EscrowCreateForm />);

      expect(screen.queryByTestId("link-card")).not.toBeInTheDocument();
      expect(screen.queryByTestId("share-modal")).not.toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("shows the markdown preview only when a description is typed", async () => {
      const user = userEvent.setup();
      render(<EscrowCreateForm />);

      expect(screen.queryByText("Preview:")).not.toBeInTheDocument();

      await user.type(screen.getByLabelText("Description"), "A **bold** widget");

      expect(screen.getByText("Preview:")).toBeInTheDocument();
      expect(screen.getByText("bold").tagName).toBe("STRONG");
    });
  });

  describe("validation", () => {
    it("shows field errors and skips the API call when submitting an empty form", async () => {
      const user = userEvent.setup();
      render(<EscrowCreateForm />);

      await submitForm(user);

      expect(screen.getByText("Item name is required.")).toHaveAttribute(
        "role",
        "alert"
      );
      expect(screen.getByText("Price is required.")).toHaveAttribute(
        "role",
        "alert"
      );
      expect(screen.getByText("Description is required.")).toHaveAttribute(
        "role",
        "alert"
      );
      expect(mockCreateEscrow).not.toHaveBeenCalled();
    });

    it("rejects a non-positive price", async () => {
      const user = userEvent.setup();
      render(<EscrowCreateForm />);

      await user.type(screen.getByLabelText("Item name"), "Widget");
      await user.type(screen.getByLabelText("Price (USDC)"), "0");
      await user.type(screen.getByLabelText("Description"), "Something");
      await submitForm(user);

      expect(screen.getByText("Price must be a positive number.")).toBeInTheDocument();
      expect(mockCreateEscrow).not.toHaveBeenCalled();
    });

    it("clears a field error when the user edits that field", async () => {
      const user = userEvent.setup();
      render(<EscrowCreateForm />);

      await submitForm(user);
      expect(screen.getByText("Item name is required.")).toBeInTheDocument();

      await user.type(screen.getByLabelText("Item name"), "Widget");

      expect(
        screen.queryByText("Item name is required.")
      ).not.toBeInTheDocument();
      expect(screen.getByText("Price is required.")).toBeInTheDocument();
    });
  });

  describe("successful submission", () => {
    it("calls the API with trimmed values and renders the shareable link card", async () => {
      const user = userEvent.setup();
      mockCreateEscrow.mockResolvedValue({
        url: "https://trustlink.test/escrow/abc123",
      } as Awaited<ReturnType<typeof createEscrow>>);
      render(<EscrowCreateForm />);

      await fillRequiredFields(user, { itemName: "  Awesome Widget  " });
      await submitForm(user);

      expect(await screen.findByTestId("link-card")).toBeInTheDocument();
      expect(mockCreateEscrow).toHaveBeenCalledWith({
        itemName: "Awesome Widget",
        priceUSDC: "123.45",
        description: "A **bold** widget",
        shippingWindow: "Same day",
      });
      expect(screen.getByTestId("shareable-url")).toHaveValue(
        "https://trustlink.test/escrow/abc123"
      );
    });

    it("opens the share modal after a successful submission", async () => {
      const user = userEvent.setup();
      mockCreateEscrow.mockResolvedValue({
        url: "https://trustlink.test/escrow/abc123",
      } as Awaited<ReturnType<typeof createEscrow>>);
      render(<EscrowCreateForm />);

      await fillRequiredFields(user);
      await submitForm(user);

      expect(await screen.findByTestId("share-modal")).toHaveTextContent(
        "https://trustlink.test/escrow/abc123"
      );
      expect(screen.getByTestId("share-modal")).toHaveTextContent("abc123");
    });

    it("renders the QR code and a WhatsApp share link with the encoded URL", async () => {
      const user = userEvent.setup();
      const url = "https://trustlink.test/escrow/abc123";
      mockCreateEscrow.mockResolvedValue({ url } as Awaited<
        ReturnType<typeof createEscrow>
      >);
      render(<EscrowCreateForm />);

      await fillRequiredFields(user);
      await submitForm(user);
      await screen.findByTestId("link-card");

      expect(screen.getByTestId("qr-code")).toBeInTheDocument();
      const whatsappLink = screen.getByRole("link", {
        name: /share on whatsapp/i,
      });
      expect(whatsappLink).toHaveAttribute(
        "href",
        expect.stringContaining(encodeURIComponent(url))
      );
    });

    it("locks the submit button and shows the pending label while creating", async () => {
      const user = userEvent.setup();
      let resolveCreate: (value: { url: string }) => void = () => {};
      mockCreateEscrow.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveCreate = resolve;
          })
      );
      render(<EscrowCreateForm />);

      await fillRequiredFields(user);
      await submitForm(user);

      const button = screen.getByRole("button", { name: /creating link/i });
      expect(button).toBeDisabled();
      expect(screen.getByLabelText("Item name")).toBeDisabled();

      resolveCreate({ url: "https://trustlink.test/escrow/xyz" });
      await screen.findByTestId("link-card");
      expect(
        screen.getByRole("button", { name: /create escrow link/i })
      ).toBeEnabled();
    });

    it("copies the link to the clipboard and confirms it", async () => {
      const user = userEvent.setup();
      // userEvent installs its own navigator.clipboard stub, so the spy must
      // be attached after setup() to observe writeText calls.
      const writeText = vi
        .spyOn(navigator.clipboard, "writeText")
        .mockResolvedValue(undefined);
      const url = "https://trustlink.test/escrow/abc123";
      mockCreateEscrow.mockResolvedValue({ url } as Awaited<
        ReturnType<typeof createEscrow>
      >);
      render(<EscrowCreateForm />);

      await fillRequiredFields(user);
      await submitForm(user);
      await screen.findByTestId("link-card");

      await user.click(screen.getByRole("button", { name: /copy link/i }));

      expect(writeText).toHaveBeenCalledWith(url);
      expect(
        await screen.findByText("Link copied to clipboard.")
      ).toBeInTheDocument();
    });

    it("shows a toast when downloading the QR code", async () => {
      const { toast } = await import("sonner");
      const user = userEvent.setup();
      mockCreateEscrow.mockResolvedValue({
        url: "https://trustlink.test/escrow/abc123",
      } as Awaited<ReturnType<typeof createEscrow>>);
      render(<EscrowCreateForm />);

      await fillRequiredFields(user);
      await submitForm(user);
      await screen.findByTestId("link-card");

      await user.click(screen.getByRole("button", { name: /download qr/i }));

      expect(toast.success).toHaveBeenCalledWith("QR code downloaded");
    });
  });

  describe("submission errors", () => {
    it("surfaces an API rejection message in an alert", async () => {
      const user = userEvent.setup();
      mockCreateEscrow.mockRejectedValue(new Error("Network error"));
      render(<EscrowCreateForm />);

      await fillRequiredFields(user);
      await submitForm(user);

      const alert = await screen.findByRole("alert");
      expect(alert).toHaveTextContent("Network error");
      expect(screen.queryByTestId("link-card")).not.toBeInTheDocument();
    });

    it("rejects a malformed URL returned by the API", async () => {
      const user = userEvent.setup();
      mockCreateEscrow.mockResolvedValue({
        url: "javascript:alert(1)",
      } as Awaited<ReturnType<typeof createEscrow>>);
      render(<EscrowCreateForm />);

      await fillRequiredFields(user);
      await submitForm(user);

      expect(
        await screen.findByText("The escrow service returned an invalid URL.")
      ).toHaveAttribute("role", "alert");
      expect(screen.queryByTestId("link-card")).not.toBeInTheDocument();
    });

    it("falls back to a generic message for non-Error rejections", async () => {
      const user = userEvent.setup();
      mockCreateEscrow.mockRejectedValue("boom");
      render(<EscrowCreateForm />);

      await fillRequiredFields(user);
      await submitForm(user);

      expect(
        await screen.findByText("Something went wrong. Please try again.")
      ).toHaveAttribute("role", "alert");
    });

    it("lets the user retry after a failed submission", async () => {
      const user = userEvent.setup();
      mockCreateEscrow.mockRejectedValueOnce(new Error("Network error"));
      render(<EscrowCreateForm />);

      await fillRequiredFields(user);
      await submitForm(user);
      await screen.findByRole("alert");

      mockCreateEscrow.mockResolvedValueOnce({
        url: "https://trustlink.test/escrow/ok",
      } as Awaited<ReturnType<typeof createEscrow>>);
      await submitForm(user);

      expect(await screen.findByTestId("link-card")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });
});
