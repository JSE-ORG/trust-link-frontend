import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it } from "vitest";

import { HowItWorks } from "../HowItWorks";

describe("HowItWorks", () => {
  it("renders the section title", () => {
    render(<HowItWorks />);
    expect(
      screen.getByRole("heading", { name: "How TrustLink Escrow Works" })
    ).toBeInTheDocument();
  });

  it("renders all three steps with correct titles and descriptions", () => {
    render(<HowItWorks />);
    
    // Step 1
    expect(screen.getByText("1. Deposit Funds")).toBeInTheDocument();
    expect(screen.getByText(/You fund the secure smart contract/i)).toBeInTheDocument();

    // Step 2
    expect(screen.getByText("2. Seller Delivers")).toBeInTheDocument();
    expect(screen.getByText(/The seller securely ships the item or delivers the service/i)).toBeInTheDocument();

    // Step 3
    expect(screen.getByText("3. Funds Released")).toBeInTheDocument();
    expect(screen.getByText(/Once you confirm receipt and are satisfied/i)).toBeInTheDocument();
  });

  it("renders the correct number of step headings", () => {
    render(<HowItWorks />);
    // The main heading (h2) + 3 step headings (h3)
    const headings = screen.getAllByRole("heading");
    expect(headings).toHaveLength(4);
  });
});
