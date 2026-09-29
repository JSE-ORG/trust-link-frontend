import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect,it } from "vitest";

import EmptyVendorState from "../EmptyVendorState";

describe("EmptyVendorState", () => {
  it("renders the default headline correctly", () => {
    render(<EmptyVendorState />);
    const heading = screen.getByRole("heading", { name: "No escrows yet" });
    expect(heading).toBeInTheDocument();
  });

  it("renders custom headline and description when provided", () => {
    render(<EmptyVendorState title="Custom Title" description="Custom Description" />);
    expect(screen.getByRole("heading", { name: "Custom Title" })).toBeInTheDocument();
    expect(screen.getByText("Custom Description")).toBeInTheDocument();
  });

  it("renders the CTA button with correct text and accessible link", () => {
    render(<EmptyVendorState />);
    const link = screen.getByRole("link", { name: "Create your first Escrow Link" });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "/create");
  });

  it("renders the icon/illustration properly via aria-hidden", () => {
    // Lucide icons render as SVG, and we've added aria-hidden="true" to it
    const { container } = render(<EmptyVendorState />);
    const svgIcon = container.querySelector("svg");
    expect(svgIcon).toBeInTheDocument();
    expect(svgIcon).toHaveAttribute("aria-hidden", "true");
  });
});
