import { render, screen, within } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import { HowItWorks } from "../HowItWorks";

// lucide-react is an external dependency: mock it so a failing icon import shows up
// here as a failing assertion instead of an opaque render error.
vi.mock("lucide-react", () => ({
  ShieldCheck: (props: Record<string, unknown>) => (
    <span data-testid="icon-shield" {...props} />
  ),
  Truck: (props: Record<string, unknown>) => (
    <span data-testid="icon-truck" {...props} />
  ),
  CheckCircle2: (props: Record<string, unknown>) => (
    <span data-testid="icon-check" {...props} />
  ),
}));

const STEPS = [
  {
    title: "1. Deposit Funds",
    description: /You fund the secure smart contract/i,
    icon: "icon-shield",
  },
  {
    title: "2. Seller Delivers",
    description: /The seller securely ships the item or delivers the service/i,
    icon: "icon-truck",
  },
  {
    title: "3. Funds Released",
    description: /Once you confirm receipt and are satisfied/i,
    icon: "icon-check",
  },
];

function renderSection() {
  const { container } = render(<HowItWorks />);
  const section = container.querySelector("section");
  if (!section) throw new Error("HowItWorks did not render a <section>");
  return section;
}

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

  it("keeps the heading levels in order: one h2, then three h3", () => {
    renderSection();
    const headings = screen.getAllByRole("heading");
    expect(headings[0].tagName).toBe("H2");
    expect(headings.slice(1).map((h) => h.tagName)).toEqual(["H3", "H3", "H3"]);
    expect(headings[0]).toHaveTextContent("How TrustLink Escrow Works");
  });

  it("pairs every step with its own icon inside that step", () => {
    renderSection();
    for (const { title, description, icon } of STEPS) {
      const heading = screen.getByRole("heading", { name: title });
      const step = heading.parentElement;
      expect(step).not.toBeNull();
      expect(within(step as HTMLElement).getByText(description)).toBeInTheDocument();
      expect(within(step as HTMLElement).getByTestId(icon)).toBeInTheDocument();
    }
  });

  it("gives each step a distinct icon instead of reusing one", () => {
    renderSection();
    const icons = STEPS.map(({ icon }) => screen.getByTestId(icon));
    expect(new Set(icons.map((el) => el.getAttribute("data-testid"))).size).toBe(3);
  });

  it("renders each step exactly once", () => {
    renderSection();
    for (const { title } of STEPS) {
      expect(screen.getAllByRole("heading", { name: title })).toHaveLength(1);
    }
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
  });

  it("stays a static, read-only section: nothing to click, no form controls", () => {
    renderSection();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
    expect(screen.queryAllByRole("link")).toHaveLength(0);
    expect(screen.queryAllByRole("textbox")).toHaveLength(0);
  });

  it("renders without React act() warnings", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    try {
      render(<HowItWorks />);
      const actWarnings = errorSpy.mock.calls
        .map((call) => call.map(String).join(" "))
        .filter((line) => line.includes("act(") || line.includes("not wrapped in act"));
      expect(actWarnings).toEqual([]);
    } finally {
      errorSpy.mockRestore();
    }
  });
});
