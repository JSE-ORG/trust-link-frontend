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