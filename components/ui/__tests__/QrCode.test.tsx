import { render, screen } from "@testing-library/react";
import { QRCodeSVG } from "qrcode.react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";

import { QrCode } from "../QrCode";

function modules(svg: Element) {
  return svg.querySelector('path[fill="#000000"]')?.getAttribute("d");
}

describe("QrCode", () => {
  it("preserves its accessible alternative, default size of 160, and four-module quiet zone", async () => {
    const value = "https://trustlink.test/pay/order?amount=25&memo=buyer%20one";
    const { container } = render(
      <>
        <QrCode value={value} />
        <QRCodeSVG value={value} marginSize={0} data-testid="without-margin" />
      </>
    );

    const svg = await screen.findByRole("img", { name: `QR code for ${value}` });
    expect(svg).toHaveAttribute("width", "160");
    expect(svg).toHaveAttribute("height", "160");

    const size = Number(svg.getAttribute("viewBox")?.split(" ")[2]);
    const bareSize = Number(
      screen.getByTestId("without-margin").getAttribute("viewBox")?.split(" ")[2]
    );
    expect(size).toBe(bareSize + 8);
    expect(modules(svg)).toBeTruthy();
    expect(container.querySelector('path[fill="#FFFFFF"]')).toBeInTheDocument();
  });

  it("encodes different URLs with equal character sums distinctly", async () => {
    const { rerender } = render(<QrCode value="https://trustlink.test/pay/ab" />);
    const first = modules(await screen.findByTestId("qr-code"));

    rerender(<QrCode value="https://trustlink.test/pay/ba" />);
    const secondSvg = await screen.findByTestId("qr-code");
    expect(modules(secondSvg)).toBeTruthy();
    expect(modules(secondSvg)).not.toBe(first);
  });

  it("increases QR capacity for long URLs and updates when the URL changes", async () => {
    const { rerender } = render(<QrCode value="https://trustlink.test/pay/a" />);
    const initialSvg = await screen.findByTestId("qr-code");
    const firstSize = Number(initialSvg.getAttribute("viewBox")?.split(" ")[2]);

    const value = `https://trustlink.test/pay/order?memo=${"buyer%20".repeat(80)}&amount=25`;
    rerender(<QrCode value={value} />);

    const svg = await screen.findByRole("img", { name: `QR code for ${value}` });
    expect(Number(svg.getAttribute("viewBox")?.split(" ")[2])).toBeGreaterThan(firstSize);
    expect(modules(svg)).toBeTruthy();
  });

  it("renders with explicit custom size, label, and className", async () => {
    const value = "https://trustlink.test/pay/custom";
    const { container } = render(
      <QrCode
        value={value}
        size={200}
        label="Custom Payment QR"
        className="custom-qr-frame"
      />
    );

    const svg = await screen.findByRole("img", { name: "Custom Payment QR" });
    expect(svg).toHaveAttribute("width", "200");
    expect(svg).toHaveAttribute("height", "200");
    expect(screen.getByTestId("qr-code")).toBe(svg);
    expect(container.firstChild).toHaveClass("custom-qr-frame");
  });

  it("renders a loading skeleton when showSkeleton is true and hides it when false", async () => {
    const value = "https://trustlink.test/pay/skeleton";
    const { rerender } = render(<QrCode value={value} size={180} showSkeleton />);

    const skeleton = screen.getByTestId("qr-code-skeleton");
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveStyle({ width: "180px", height: "180px" });
    expect(screen.queryByTestId("qr-code")).not.toBeInTheDocument();

    rerender(<QrCode value={value} size={180} showSkeleton={false} />);
    const svg = await screen.findByTestId("qr-code");
    expect(svg).toBeInTheDocument();
    expect(screen.queryByTestId("qr-code-skeleton")).not.toBeInTheDocument();
  });

  it("forwards ref to the wrapper so svg can be queried for PNG export", async () => {
    const ref = createRef<HTMLDivElement>();
    const value = "https://trustlink.test/pay/export";
    render(<QrCode ref={ref} value={value} />);

    const svg = await screen.findByTestId("qr-code");
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
    expect(ref.current?.querySelector("svg")).toBe(svg);
  });
});
