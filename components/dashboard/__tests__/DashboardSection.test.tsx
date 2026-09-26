import { render, screen, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import DashboardSection from "../DashboardSection";

// Stub the data-fetching children so DashboardSection is tested in isolation.
vi.mock("@/components/dashboard/DashboardAnalyticsSummary", () => ({
  default: () => <div data-testid="analytics-summary" />,
}));

vi.mock("@/components/dashboard/VendorDashboardList", () => ({
  default: () => <div data-testid="vendor-dashboard-list" />,
}));

/** Returns the card element that wraps the heading with the given name. */
function getCardByHeading(name: string): HTMLElement {
  const card = screen.getByRole("heading", { level: 2, name }).closest("div.rounded-3xl");
  if (!(card instanceof HTMLElement)) throw new Error(`No card found for heading "${name}"`);
  return card;
}

describe("DashboardSection", () => {
  it("renders inside a single section landmark", () => {
    const { container } = render(<DashboardSection />);
    expect(container.querySelectorAll("section")).toHaveLength(1);
  });

  it("renders both card headings in order", () => {
    render(<DashboardSection />);
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual(["Analytics Overview", "Your Escrows"]);
  });

  it("renders the analytics card with its description and summary chart", () => {
    render(<DashboardSection />);
    const card = getCardByHeading("Analytics Overview");

    expect(within(card).getByText("Escrow volume over the last 30 days.")).toBeInTheDocument();
    expect(within(card).getByTestId("analytics-summary")).toBeInTheDocument();
    expect(within(card).queryByTestId("vendor-dashboard-list")).not.toBeInTheDocument();
  });

  it("renders the escrows card with its description and vendor list", () => {
    render(<DashboardSection />);
    const card = getCardByHeading("Your Escrows");

    expect(within(card).getByText("Manage and track all your active escrows.")).toBeInTheDocument();
    expect(within(card).getByTestId("vendor-dashboard-list")).toBeInTheDocument();
    expect(within(card).queryByTestId("analytics-summary")).not.toBeInTheDocument();
  });

  it("renders each child component exactly once", () => {
    render(<DashboardSection />);
    expect(screen.getAllByTestId("analytics-summary")).toHaveLength(1);
    expect(screen.getAllByTestId("vendor-dashboard-list")).toHaveLength(1);
  });
});
