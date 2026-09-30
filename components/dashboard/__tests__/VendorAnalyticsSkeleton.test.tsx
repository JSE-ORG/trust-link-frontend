import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import VendorAnalyticsSkeleton from "../VendorAnalyticsSkeleton";

describe("VendorAnalyticsSkeleton", () => {
  it("renders correctly without crashing", () => {
    const { container } = render(<VendorAnalyticsSkeleton />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it("renders multiple elements", () => {
    const { container } = render(<VendorAnalyticsSkeleton />);
    // Check that there are elements inside
    expect(container.querySelectorAll("div").length).toBeGreaterThan(0);
  });
});
