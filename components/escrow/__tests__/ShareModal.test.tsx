import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("@/components/ui/QRCodeComponent", () => ({
  default: ({ value }: { value: string }) => (
    <div data-testid="qr-code" data-value={value} />
  ),
}));

vi.mock("@/lib/analytics", () => ({
  track: vi.fn().mockResolvedValue(undefined),
}));

import ShareModal from "../ShareModal";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ShareModal from "../ShareModal";

vi.mock("@/lib/analytics", () => ({
  track: vi.fn(),
}));
vi.mock("@/components/ui/QRCodeComponent", () => ({
  default: () => null,
}));

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  url: "https://trustlink.example.com/pay/1293",
  escrowId: "1293",
};

describe("ShareModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rendering", () => {
    test("renders the modal when isOpen is true", () => {
      render(<ShareModal {...defaultProps} />);
      expect(screen.getByText("Escrow Link Generated!")).toBeInTheDocument();
    });

    test("renders the share description", () => {
      render(<ShareModal {...defaultProps} />);
      expect(
        screen.getByText(/share this link with your buyer/i)
      ).toBeInTheDocument();
    });

    test("renders the URL in the input field", () => {
      render(<ShareModal {...defaultProps} />);
      const input = screen.getByDisplayValue(defaultProps.url);
      expect(input).toBeInTheDocument();
    });

    test("renders the QR code", () => {
      render(<ShareModal {...defaultProps} />);
      expect(screen.getByTestId("qr-code")).toBeInTheDocument();
    });

    test("does not render content when isOpen is false", () => {
      render(<ShareModal {...defaultProps} isOpen={false} />);
      expect(
        screen.queryByText("Escrow Link Generated!")
      ).not.toBeInTheDocument();
    });
  });

  describe("Copy functionality", () => {
    test("copy button shows Copied! after clicking", async () => {
      const user = userEvent.setup();
      render(<ShareModal {...defaultProps} />);

      const copyButton = screen.getByRole("button", { name: /copy link/i });
      await user.click(copyButton);

      await waitFor(() => {
        expect(screen.getByText("Copied!")).toBeInTheDocument();
      });
    });

    test("copy button aria-label changes after copying", async () => {
      const user = userEvent.setup();
      render(<ShareModal {...defaultProps} />);

      const copyButton = screen.getByRole("button", { name: /copy link/i });
      expect(copyButton).toHaveAttribute(
        "aria-label",
        "Copy link to clipboard"
      );

      await user.click(copyButton);

      await waitFor(() => {
        expect(copyButton).toHaveAttribute(
          "aria-label",
          "Link copied to clipboard"
        );
      });
    });
  });

  describe("WhatsApp share", () => {
    test("WhatsApp button opens correct URL", async () => {
      const openSpy = vi.spyOn(window, "open").mockImplementation(() => null);
      const user = userEvent.setup();

      render(<ShareModal {...defaultProps} />);

      const whatsappButton = screen.getByRole("button", {
        name: /whatsapp/i,
      });
      await user.click(whatsappButton);

      await waitFor(() => {
        expect(openSpy).toHaveBeenCalledWith(
          expect.stringContaining("whatsapp://send?text="),
          "_blank"
        );
      });

      openSpy.mockRestore();
    });
  });

  describe("Native share", () => {
    afterEach(() => {
      Reflect.deleteProperty(navigator, "share");
    });

    test("renders share button when navigator.share is available", () => {
      Object.defineProperty(navigator, "share", {
        value: vi.fn().mockResolvedValue(undefined),
        writable: true,
        configurable: true,
      });

      render(<ShareModal {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: /share/i })
      ).toBeInTheDocument();
    });

    test("calls navigator.share when share button is clicked", async () => {
      const share = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, "share", {
        value: share,
        writable: true,
        configurable: true,
      });
      const user = userEvent.setup();

      render(<ShareModal {...defaultProps} />);

      const shareButton = screen.getByRole("button", { name: /share/i });
      await user.click(shareButton);

      await waitFor(() => expect(share).toHaveBeenCalledTimes(1));
      expect(share).toHaveBeenCalledWith({
        title: "TrustLink Payment",
        text: expect.stringContaining("Pay for your order securely"),
        url: defaultProps.url,
      });
    });

    test("does not render share button when navigator.share is unavailable", () => {
      Object.defineProperty(navigator, "share", {
        value: undefined,
        writable: true,
        configurable: true,
      });

      render(<ShareModal {...defaultProps} />);
      expect(
        screen.queryByRole("button", { name: /^share$/i })
      ).not.toBeInTheDocument();
    });
  });

  describe("Dialog behavior", () => {
    test("renders dialog with correct role", () => {
      render(<ShareModal {...defaultProps} />);
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    test("dialog has close button", () => {
      render(<ShareModal {...defaultProps} />);
      expect(
        screen.getByRole("button", { name: /close/i })
      ).toBeInTheDocument();
    });
  });
});
  url: "https://trustlink.example/pay/escrow-123",
};

describe("ShareModal keyboard accessibility", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("focuses the copy action with Tab and activates it with Enter", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    render(<ShareModal {...defaultProps} />);

    await user.tab();
    await user.tab();
    await user.tab();

    const copyButton = screen.getByRole("button", {
      name: "Copy link to clipboard",
    });
    expect(copyButton).toHaveFocus();
    expect(copyButton).toHaveClass("focus-visible:ring-2");

    await user.keyboard("{Enter}");

    expect(writeText).toHaveBeenCalledWith(defaultProps.url);
    expect(screen.getByRole("status")).toHaveTextContent("Link copied!");
  });

  it("focuses the WhatsApp action with Tab and activates it with Space", async () => {
    const user = userEvent.setup();
    const openWindow = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<ShareModal {...defaultProps} />);

    await user.tab();
    await user.tab();
    await user.tab();
    await user.tab();

    const whatsappButton = screen.getByRole("button", { name: /whatsapp/i });
    expect(whatsappButton).toHaveFocus();
    expect(whatsappButton).toHaveClass("focus-visible:ring-2");

    await user.keyboard(" ");

    expect(openWindow).toHaveBeenCalledWith(
      expect.stringContaining("whatsapp://send?text="),
      "_blank"
    );
  });
});
