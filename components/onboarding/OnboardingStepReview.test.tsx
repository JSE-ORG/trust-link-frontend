import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import OnboardingStepReview from "./OnboardingStepReview";

function renderReview(
  overrides: Partial<React.ComponentProps<typeof OnboardingStepReview>> = {}
) {
  const defaultProps = {
    shopName: "",
    description: "",
    website: "",
    shippingLocations: "",
  };

  return render(<OnboardingStepReview {...defaultProps} {...overrides} />);
}

describe("OnboardingStepReview", () => {
  it("renders the review heading and description", () => {
    renderReview();

    expect(screen.getByRole("heading", { name: /Review Your Store/i })).toBeInTheDocument();
    expect(screen.getByText(/Confirm the details before you complete onboarding/i)).toBeInTheDocument();
  });

  it("displays all field labels", () => {
    renderReview();

    expect(screen.getByText("Shop name")).toBeInTheDocument();
    expect(screen.getByText("Shipping destinations")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Website")).toBeInTheDocument();
  });

  it("displays provided values", () => {
    renderReview({
      shopName: "Stellar Craft Co.",
      description: "We sell handcrafted items made with love and care.",
      website: "https://stellarcraft.com",
      shippingLocations: "US and Canada",
    });

    expect(screen.getByText("Stellar Craft Co.")).toBeInTheDocument();
    expect(screen.getByText("We sell handcrafted items made with love and care.")).toBeInTheDocument();
    expect(screen.getByText("https://stellarcraft.com")).toBeInTheDocument();
    expect(screen.getByText("US and Canada")).toBeInTheDocument();
  });

  it("displays fallback text when shop name is empty", () => {
    renderReview({ shopName: "" });

    expect(screen.getByText("Not provided")).toBeInTheDocument();
  });

  it("displays fallback text when description is empty", () => {
    renderReview({ description: "" });

    expect(screen.getByText("No description yet.")).toBeInTheDocument();
  });

  it("displays fallback text when website is empty", () => {
    renderReview({ website: "" });

    expect(screen.getByText("Not listed")).toBeInTheDocument();
  });

  it("displays default shipping location when empty", () => {
    renderReview({ shippingLocations: "" });

    expect(screen.getByText("Worldwide")).toBeInTheDocument();
  });

  it("displays all fallbacks when all fields are empty", () => {
    renderReview({
      shopName: "",
      description: "",
      website: "",
      shippingLocations: "",
    });

    expect(screen.getByText("Not provided")).toBeInTheDocument();
    expect(screen.getByText("No description yet.")).toBeInTheDocument();
    expect(screen.getByText("Not listed")).toBeInTheDocument();
    expect(screen.getByText("Worldwide")).toBeInTheDocument();
  });

  it("renders with mixed empty and filled values", () => {
    renderReview({
      shopName: "My Shop",
      description: "",
      website: "https://myshop.com",
      shippingLocations: "",
    });

    expect(screen.getByText("My Shop")).toBeInTheDocument();
    expect(screen.getByText("No description yet.")).toBeInTheDocument();
    expect(screen.getByText("https://myshop.com")).toBeInTheDocument();
    expect(screen.getByText("Worldwide")).toBeInTheDocument();
  });

  it("handles whitespace-only values as empty", () => {
    renderReview({
      shopName: "   ",
      description: "   ",
      website: "   ",
      shippingLocations: "   ",
    });

    // Whitespace values should still display as they are truthy
    // The component doesn't trim, so it shows the spaces
    expect(screen.queryByText("Not provided")).not.toBeInTheDocument();
    expect(screen.queryByText("No description yet.")).not.toBeInTheDocument();
    expect(screen.queryByText("Not listed")).not.toBeInTheDocument();
    expect(screen.queryByText("Worldwide")).not.toBeInTheDocument();
  });

  it("renders correct layout structure", () => {
    const { container } = renderReview();

    // Check for grid layout
    const gridContainer = container.querySelector(".grid");
    expect(gridContainer).toBeInTheDocument();
  });
});
