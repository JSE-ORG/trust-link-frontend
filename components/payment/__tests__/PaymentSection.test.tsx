import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PaymentSection, { parsePaymentInput } from "../PaymentSection";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("parsePaymentInput", () => {
  it("rejects blank or whitespace-only inputs", () => {
    expect(parsePaymentInput("")).toEqual({
      ok: false,
      error: "Please enter an escrow ID or payment link.",
    });
    expect(parsePaymentInput("    ")).toEqual({
      ok: false,
      error: "Please enter an escrow ID or payment link.",
    });
  });

  it("accepts valid escrow IDs and normalizes them to /pay/{id}", () => {
    expect(parsePaymentInput("escrow-123")).toEqual({
      ok: true,
      path: "/pay/escrow-123",
    });
    expect(parsePaymentInput("  order_456  ")).toEqual({
      ok: true,
      path: "/pay/order_456",
    });
  });

  it("accepts same-site relative /pay/{id} links", () => {
    expect(parsePaymentInput("/pay/escrow-123")).toEqual({
      ok: true,
      path: "/pay/escrow-123",
    });
    expect(parsePaymentInput("pay/escrow-123")).toEqual({
      ok: true,
      path: "/pay/escrow-123",
    });
  });

  it("accepts same-site absolute URLs matching current origin or NEXT_PUBLIC_SITE_URL", () => {
    const origin = "http://localhost:3000";
    expect(
      parsePaymentInput("http://localhost:3000/pay/escrow-789", origin)
    ).toEqual({
      ok: true,
      path: "/pay/escrow-789",
    });

    const prevSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
    process.env.NEXT_PUBLIC_SITE_URL = "https://trustlink.app";
    expect(
      parsePaymentInput("https://trustlink.app/pay/escrow-abc", origin)
    ).toEqual({
      ok: true,
      path: "/pay/escrow-abc",
    });
    process.env.NEXT_PUBLIC_SITE_URL = prevSiteUrl;
  });

  it("rejects external payment links with actionable feedback", () => {
    const origin = "http://localhost:3000";
    const result = parsePaymentInput("https://phishing.example/pay/escrow-123", origin);
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/external payment links are not allowed/i);
  });

  it("rejects malformed URLs, missing IDs, or wrong paths", () => {
    expect(parsePaymentInput("javascript:alert(1)").ok).toBe(false);
    expect(parsePaymentInput("/pay/").ok).toBe(false);
    expect(parsePaymentInput("/track/escrow-123").ok).toBe(false);
    expect(parsePaymentInput("/pay/escrow/extra").ok).toBe(false);
    expect(parsePaymentInput("escrow 123 with spaces").ok).toBe(false);
    expect(parsePaymentInput("escrow/has/slashes").ok).toBe(false);
  });
});

describe("PaymentSection component", () => {
  const pushMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useRouter).mockReturnValue({
      push: pushMock,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    });
  });

  it("renders the skeleton when loading is true", () => {
    render(<PaymentSection loading={true} />);
    expect(screen.getByRole("status")).toHaveAttribute(
      "aria-label",
      "Loading payment section"
    );
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
  });

  it("renders the lookup form with heading, input and button when not loading", () => {
    render(<PaymentSection loading={false} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Open Escrow Payment" })
    ).toBeInTheDocument();
    expect(screen.getByRole("form", { name: "Open payment link" })).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("e.g. escrow-123 or /pay/escrow-123")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Open Payment" })
    ).toBeInTheDocument();
  });

  it("shows actionable error for blank input and prevents navigation", async () => {
    const user = userEvent.setup();
    render(<PaymentSection />);

    const submitBtn = screen.getByRole("button", { name: "Open Payment" });
    await user.click(submitBtn);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Please enter an escrow ID or payment link.");
    expect(pushMock).not.toHaveBeenCalled();

    const input = screen.getByPlaceholderText("e.g. escrow-123 or /pay/escrow-123");
    expect(input).toHaveAttribute("aria-invalid", "true");
  });

  it("shows actionable error for external URLs and prevents navigation", async () => {
    const user = userEvent.setup();
    render(<PaymentSection />);

    const input = screen.getByPlaceholderText("e.g. escrow-123 or /pay/escrow-123");
    await user.type(input, "https://external-site.com/pay/order-123");

    const submitBtn = screen.getByRole("button", { name: "Open Payment" });
    await user.click(submitBtn);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/external payment links are not allowed/i);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("shows actionable error for malformed inputs and prevents navigation", async () => {
    const user = userEvent.setup();
    render(<PaymentSection />);

    const input = screen.getByPlaceholderText("e.g. escrow-123 or /pay/escrow-123");
    await user.type(input, "/invalid/path");

    const submitBtn = screen.getByRole("button", { name: "Open Payment" });
    await user.click(submitBtn);

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/please provide a valid payment link/i);
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("navigates to /pay/{id} for a valid escrow ID", async () => {
    const user = userEvent.setup();
    render(<PaymentSection />);

    const input = screen.getByPlaceholderText("e.g. escrow-123 or /pay/escrow-123");
    await user.type(input, "escrow-987");

    const submitBtn = screen.getByRole("button", { name: "Open Payment" });
    await user.click(submitBtn);

    expect(pushMock).toHaveBeenCalledWith("/pay/escrow-987");
  });

  it("navigates to /pay/{id} for a same-site /pay/{id} link", async () => {
    const user = userEvent.setup();
    render(<PaymentSection />);

    const input = screen.getByPlaceholderText("e.g. escrow-123 or /pay/escrow-123");
    await user.type(input, "/pay/escrow-987");

    const submitBtn = screen.getByRole("button", { name: "Open Payment" });
    await user.click(submitBtn);

    expect(pushMock).toHaveBeenCalledWith("/pay/escrow-987");
  });

  it("works with Enter key to submit", async () => {
    const user = userEvent.setup();
    render(<PaymentSection />);

    const input = screen.getByPlaceholderText("e.g. escrow-123 or /pay/escrow-123");
    await user.type(input, "order-abc{Enter}");

    expect(pushMock).toHaveBeenCalledWith("/pay/order-abc");
  });

  it("clears error message when user starts typing", async () => {
    const user = userEvent.setup();
    render(<PaymentSection />);

    const submitBtn = screen.getByRole("button", { name: "Open Payment" });
    await user.click(submitBtn);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    const input = screen.getByPlaceholderText("e.g. escrow-123 or /pay/escrow-123");
    await user.type(input, "e");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
