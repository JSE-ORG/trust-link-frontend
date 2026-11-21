import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import DocsClient from "./DocsClient";

describe("Documentation and Guides Page (/docs)", () => {
  it("renders all 5 core user journey sections", () => {
    render(<DocsClient />);

    expect(screen.getByRole("heading", { name: /core escrow concepts & architecture/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /creating & sharing escrow links/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /reviewing, signing & funding escrows/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /order tracking & carrier status updates/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /filing claims, evidence upload & arbitration/i })).toBeInTheDocument();
  });

  it("includes 'Back to Home' and 'Open an Escrow' CTA buttons", () => {
    render(<DocsClient />);

    const homeLinks = screen.getAllByRole("link", { name: /back to home/i });
    expect(homeLinks.length).toBeGreaterThan(0);
    homeLinks.forEach((link) => expect(link).toHaveAttribute("href", "/"));

    const escrowCtas = screen.getAllByRole("link", { name: /open an escrow/i });
    expect(escrowCtas.length).toBeGreaterThan(0);
    escrowCtas.forEach((link) => expect(link).toHaveAttribute("href", "/create"));
  });

  it("provides structured FAQ accordions in the guides", () => {
    render(<DocsClient />);

    // Verify FAQ items from different sections
    expect(
      screen.getByText(/do buyers or vendors need deep cryptocurrency experience/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/can a vendor cancel an escrow after generating a link/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/what happens if i fund an escrow but the vendor never ships/i)
    ).toBeInTheDocument();

    // Test expanding an FAQ item
    const faqButton = screen.getByRole("button", {
      name: /do buyers or vendors need deep cryptocurrency experience/i,
    });
    expect(faqButton).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(faqButton);
    expect(faqButton).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/trustlink abstracts away blockchain complexities/i)).toBeInTheDocument();
  });

  it("supports section navigation links with hash targets", () => {
    render(<DocsClient />);

    const gettingStartedLinks = screen.getAllByRole("link", { name: /getting started/i });
    expect(gettingStartedLinks.some((l) => l.getAttribute("href") === "#getting-started")).toBe(true);

    const vendorLinks = screen.getAllByRole("link", { name: /vendor guide/i });
    expect(vendorLinks.some((l) => l.getAttribute("href") === "#vendor-guide")).toBe(true);
  });
});
