import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import EscrowLinkCard from "../EscrowLinkCard";

// Mock the QR canvas so jsdom doesn't try to draw to a real canvas.
vi.mock("qrcode.react", () => ({
  QRCodeCanvas: () => <canvas data-testid="qr-code" />,
}));

// Capture toast calls without rendering the sonner portal.
const toastSuccess = vi.fn();
vi.mock("sonner", () => ({
  toast: { success: (msg: string) => toastSuccess(msg) },
}));

describe("EscrowLinkCard — Copy for Twitter/X (issue #64)", () => {
  beforeEach(() => {
    toastSuccess.mockClear();
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it("renders a Copy for Twitter/X button once the link loads", async () => {
    render(<EscrowLinkCard />);
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /copy for twitter\/x/i })
      ).toBeInTheDocument()
    );
  });

  it("copies pre-formatted tweet text including the link to the clipboard", async () => {
    render(<EscrowLinkCard />);
    const button = await screen.findByRole("button", {
      name: /copy for twitter\/x/i,
    });

    await userEvent.click(button);

    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    const copied = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>)
      .mock.calls[0][0] as string;

    // Pre-formatted text mentions the escrow and carries the share link.
    expect(copied).toMatch(/TrustLink/i);
    expect(copied).toContain("https://trustlink.example.com/pay/1293");
    expect(copied).toContain("utm_source=twitter");
  });

  it("shows a success toast after copying", async () => {
    render(<EscrowLinkCard />);
    const button = await screen.findByRole("button", {
      name: /copy for twitter\/x/i,
    });

    await userEvent.click(button);

    await waitFor(() =>
      expect(toastSuccess).toHaveBeenCalledWith("Tweet text copied!")
    );
  });
});
