import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import HomePageContent from "./HomePageContent";

describe("HomePageContent", () => {
  it("renders the hero section with heading, description, and CTAs", () => {
    render(<HomePageContent />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /secure escrow for\s*every transaction/i,
      })
    ).toBeInTheDocument();

    expect(
      screen.getByText(/trustlink protects buyers and vendors/i)
    ).toBeInTheDocument();

    const vendorSignupLinks = screen.getAllByRole("link", {
      name: /get started as a vendor|start as a vendor/i,
    });
    expect(vendorSignupLinks.length).toBeGreaterThan(0);
    vendorSignupLinks.forEach((link) =>
      expect(link).toHaveAttribute("href", "/vendor/signup")
    );

    const verifyLinks = screen.getAllByRole("link", {
      name: /verify escrow link|verify a link/i,
    });
    expect(verifyLinks.length).toBeGreaterThan(0);
    verifyLinks.forEach((link) => expect(link).toHaveAttribute("href", "/verify"));
  });

  it("renders the how it works section with all three steps", () => {
    render(<HomePageContent />);

    expect(
      screen.getByRole("heading", { level: 2, name: /how it works/i })
    ).toBeInTheDocument();

    expect(screen.getByText(/vendor creates link/i)).toBeInTheDocument();
    expect(screen.getByText(/buyer pays/i)).toBeInTheDocument();
    expect(screen.getByText(/funds released/i)).toBeInTheDocument();
  });

  it("renders the trust signals section with all three features", () => {
    render(<HomePageContent />);

    expect(
      screen.getByRole("heading", { level: 2, name: /why trustlink\?/i })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { level: 3, name: /^stellar network$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: /^smart contracts$/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: /^low fees$/i })
    ).toBeInTheDocument();
  });

  it("renders the featured artists section", () => {
    render(<HomePageContent />);

    expect(
      screen.getByRole("heading", { level: 2, name: /featured artists/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/premium electronics co\./i)).toBeInTheDocument();
  });

  it("renders the FAQ section with all questions collapsed by default", () => {
    render(<HomePageContent />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /frequently asked questions/i,
      })
    ).toBeInTheDocument();

    const question = screen.getByRole("button", {
      name: /how does trustlink protect my money\?/i,
    });
    expect(question).toHaveAttribute("aria-expanded", "false");
  });

  it("expands a FAQ item's answer when clicked", async () => {
    const user = userEvent.setup();
    render(<HomePageContent />);

    const question = screen.getByRole("button", {
      name: /how does trustlink protect my money\?/i,
    });
    expect(question).toHaveAttribute("aria-expanded", "false");

    await user.click(question);

    expect(question).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByText(/uses smart contracts on the stellar network/i)
    ).toBeInTheDocument();
  });

  it("collapses an expanded FAQ item when clicked again", async () => {
    const user = userEvent.setup();
    render(<HomePageContent />);

    const question = screen.getByRole("button", {
      name: /what payment methods are supported\?/i,
    });

    await user.click(question);
    expect(question).toHaveAttribute("aria-expanded", "true");

    await user.click(question);
    expect(question).toHaveAttribute("aria-expanded", "false");
  });

  it("renders the CTA section with vendor and verify links", () => {
    render(<HomePageContent />);

    expect(
      screen.getByRole("heading", {
        level: 2,
        name: /ready to trade with confidence\?/i,
      })
    ).toBeInTheDocument();
  });

  it("renders the footer with product and company links", () => {
    render(<HomePageContent />);

    const footer = screen.getByRole("contentinfo");
    expect(within(footer).getByText("TrustLink")).toBeInTheDocument();
    expect(
      within(footer).getByRole("link", { name: /for vendors/i })
    ).toHaveAttribute("href", "/vendor/signup");
    expect(
      within(footer).getByRole("link", { name: /^pricing$/i })
    ).toHaveAttribute("href", "/pricing");
    expect(
      within(footer).getByRole("link", { name: /^about$/i })
    ).toHaveAttribute("href", "/about");
    expect(screen.getByText(/© 2025 trustlink\. built on stellar\./i)).toBeInTheDocument();
  });
});
