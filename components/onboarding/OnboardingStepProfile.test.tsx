import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import OnboardingStepProfile from "./OnboardingStepProfile";

function renderProfile(
  overrides: Partial<React.ComponentProps<typeof OnboardingStepProfile>> = {}
) {
  const defaultProps = {
    shopName: "",
    description: "",
    website: "",
    shippingLocations: "",
    errors: {},
    onChange: vi.fn(),
  };

  return render(<OnboardingStepProfile {...defaultProps} {...overrides} />);
}

describe("OnboardingStepProfile", () => {
  it("renders the form with all input fields", () => {
    renderProfile();

    expect(screen.getByRole("heading", { name: /Vendor Profile/i })).toBeInTheDocument();
    expect(screen.getByText(/Share your business details/i)).toBeInTheDocument();
    
    expect(screen.getByLabelText(/Shop name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Website/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Shipping destinations/i)).toBeInTheDocument();
  });

  it("displays provided values in input fields", () => {
    renderProfile({
      shopName: "Test Shop",
      description: "A great shop selling quality products",
      website: "https://testshop.com",
      shippingLocations: "Worldwide",
    });

    expect(screen.getByDisplayValue("Test Shop")).toBeInTheDocument();
    expect(screen.getByDisplayValue("A great shop selling quality products")).toBeInTheDocument();
    expect(screen.getByDisplayValue("https://testshop.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Worldwide")).toBeInTheDocument();
  });

  it("calls onChange when shop name input changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderProfile({ onChange });

    const shopNameInput = screen.getByLabelText(/Shop name/i);
    await user.type(shopNameInput, "New Shop");

    expect(onChange).toHaveBeenCalledWith("shopName", "N");
    expect(onChange).toHaveBeenCalledWith("shopName", "e");
    // Check last call
    expect(onChange).toHaveBeenLastCalledWith("shopName", "p");
  });

  it("calls onChange when description input changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderProfile({ onChange });

    const descriptionInput = screen.getByLabelText(/Description/i);
    await user.type(descriptionInput, "Test");

    expect(onChange).toHaveBeenCalledWith("description", "T");
    expect(onChange).toHaveBeenCalledWith("description", "e");
  });

  it("calls onChange when website input changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderProfile({ onChange });

    const websiteInput = screen.getByLabelText(/Website/i);
    await user.type(websiteInput, "https://test.com");

    expect(onChange).toHaveBeenCalledWith("website", "h");
  });

  it("calls onChange when shipping locations input changes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderProfile({ onChange });

    const shippingInput = screen.getByLabelText(/Shipping destinations/i);
    await user.type(shippingInput, "US only");

    expect(onChange).toHaveBeenCalledWith("shippingLocations", "U");
  });

  it("displays error messages when errors are provided", () => {
    renderProfile({
      errors: {
        shopName: "Shop name is required",
        description: "Description must be at least 20 characters",
        website: "Please enter a valid URL",
      },
    });

    expect(screen.getByText("Shop name is required")).toBeInTheDocument();
    expect(screen.getByText("Description must be at least 20 characters")).toBeInTheDocument();
    expect(screen.getByText("Please enter a valid URL")).toBeInTheDocument();
  });

  it("sets aria-invalid attribute when field has error", () => {
    renderProfile({
      errors: {
        shopName: "Shop name is required",
      },
    });

    const shopNameInput = screen.getByLabelText(/Shop name/i);
    expect(shopNameInput).toHaveAttribute("aria-invalid", "true");
  });

  it("does not set aria-invalid when field has no error", () => {
    renderProfile({
      errors: {},
    });

    const shopNameInput = screen.getByLabelText(/Shop name/i);
    expect(shopNameInput).toHaveAttribute("aria-invalid", "false");
  });

  it("shows description hint when no error is present", () => {
    renderProfile({ errors: {} });

    expect(screen.getByText(/Minimum 20 characters required/i)).toBeInTheDocument();
  });

  it("hides description hint when error is present", () => {
    renderProfile({
      errors: {
        description: "Description is too short",
      },
    });

    expect(screen.queryByText(/Minimum 20 characters required/i)).not.toBeInTheDocument();
    expect(screen.getByText("Description is too short")).toBeInTheDocument();
  });

  it("associates error messages with inputs using aria-describedby", () => {
    renderProfile({
      errors: {
        shopName: "Shop name is required",
        description: "Description error",
        website: "Website error",
      },
    });

    expect(screen.getByLabelText(/Shop name/i)).toHaveAttribute("aria-describedby", "shopName-error");
    expect(screen.getByLabelText(/Description/i)).toHaveAttribute("aria-describedby", "description-error");
    expect(screen.getByLabelText(/Website/i)).toHaveAttribute("aria-describedby", "website-error");
  });

  it("marks required fields as required", () => {
    renderProfile();

    expect(screen.getByLabelText(/Shop name/i)).toBeRequired();
    expect(screen.getByLabelText(/Description/i)).toBeRequired();
  });

  it("renders with empty state", () => {
    renderProfile();

    const shopNameInput = screen.getByLabelText(/Shop name/i);
    const descriptionInput = screen.getByLabelText(/Description/i);
    const websiteInput = screen.getByLabelText(/Website/i);
    const shippingInput = screen.getByLabelText(/Shipping destinations/i);

    expect(shopNameInput).toHaveValue("");
    expect(descriptionInput).toHaveValue("");
    expect(websiteInput).toHaveValue("");
    expect(shippingInput).toHaveValue("");
  });
});
