import { render, screen } from "@testing-library/react";
import { QRCodeSVG } from "qrcode.react";
import { describe, expect, it } from "vitest";

import { QrCode } from "./QrCode";

function modules(svg: Element) {
  return svg.querySelector('path[fill="#000000"]')?.getAttribute("d");
}

describe("QrCode", () => {
  it("preserves its accessible alternative, size, and four-module quiet zone", () => {
    const value = "https://trustlink.test/pay/order?amount=25&memo=buyer%20one";
    const { container } = render(<>
      <QrCode value={value} />
      <QRCodeSVG value={value} marginSize={0} data-testid="without-margin" />
    </>);
    const svg = screen.getByRole("img", { name: `QR code for ${value}` });
    expect(svg).toHaveAttribute("width", "192");
    expect(svg).toHaveAttribute("height", "192");
    const size = Number(svg.getAttribute("viewBox")?.split(" ")[2]);
    const bareSize = Number(screen.getByTestId("without-margin").getAttribute("viewBox")?.split(" ")[2]);
    expect(size).toBe(bareSize + 8);
    expect(modules(svg)).toBeTruthy();
    expect(container.querySelector('path[fill="#FFFFFF"]')).toBeInTheDocument();
  });

  it("encodes different URLs with equal character sums distinctly", () => {
    const { rerender } = render(<QrCode value="https://trustlink.test/pay/ab" />);
    const first = modules(screen.getByTestId("qr-code"));
    rerender(<QrCode value="https://trustlink.test/pay/ba" />);
    expect(modules(screen.getByTestId("qr-code"))).toBeTruthy();
    expect(modules(screen.getByTestId("qr-code"))).not.toBe(first);
  });

  it("increases QR capacity for long URLs and updates when the URL changes", () => {
    const { rerender } = render(<QrCode value="https://trustlink.test/pay/a" />);
    const firstSize = Number(screen.getByTestId("qr-code").getAttribute("viewBox")?.split(" ")[2]);
    const value = `https://trustlink.test/pay/order?memo=${"buyer%20".repeat(80)}&amount=25`;
    rerender(<QrCode value={value} />);
    const svg = screen.getByRole("img", { name: `QR code for ${value}` });
    expect(Number(svg.getAttribute("viewBox")?.split(" ")[2])).toBeGreaterThan(firstSize);
    expect(modules(svg)).toBeTruthy();
  });

  it("renders with explicit custom size and custom label", () => {
    const value = "https://trustlink.test/pay/custom";
    render(<QrCode value={value} size={160} label="Custom Payment QR" />);
    const svg = screen.getByRole("img", { name: "Custom Payment QR" });
    expect(svg).toHaveAttribute("width", "160");
    expect(svg).toHaveAttribute("height", "160");
    expect(screen.getByTestId("qr-code")).toBe(svg);
  });
});
