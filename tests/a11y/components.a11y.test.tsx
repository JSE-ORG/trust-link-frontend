import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { axe, toHaveNoViolations } from "jest-axe";
import React from "react";
import { describe, expect,it } from "vitest";

import EmptyVendorState from "@/components/dashboard/EmptyVendorState";
import DisputeForm from "@/components/escrow/DisputeForm";
import { Badge } from "@/components/ui/Badge";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/Skeleton";

expect.extend(toHaveNoViolations);

/**
 * Run axe against WCAG 2.0/2.1 A and AA rule sets. We scope to the WCAG tags
 * (rather than axe's "best-practice" rules) so the suite asserts conformance
 * issues, and we drop colour-contrast — it cannot be computed reliably in
 * jsdom because there is no real layout/paint.
 */
async function expectNoA11yViolations(ui: React.ReactElement) {
  const { container } = render(ui);
  const results = await axe(container, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
    rules: { "color-contrast": { enabled: false } },
  });
  expect(results).toHaveNoViolations();
}

describe("accessibility — UI components have no axe violations", () => {
  it("Breadcrumb", async () => {
    await expectNoA11yViolations(
      <Breadcrumb
        items={[
          { label: "Home", href: "/" },
          { label: "Track Order", href: "/tracking" },
          { label: "Order esc_1234567890" },
        ]}
      />
    );
  });

  it("Badge", async () => {
    await expectNoA11yViolations(<Badge>Active</Badge>);
  });

  it("Button", async () => {
    await expectNoA11yViolations(<Button>Submit payment</Button>);
  });

  it("Button (disabled)", async () => {
    await expectNoA11yViolations(<Button disabled>Mark shipped</Button>);
  });

  it("Skeleton", async () => {
    await expectNoA11yViolations(
      <div role="status" aria-label="Loading">
        <Skeleton className="h-4 w-24" />
      </div>
    );
  });

  it("EmptyVendorState", async () => {
    await expectNoA11yViolations(<EmptyVendorState />);
  });

  describe("DisputeForm — all 4 steps pass axe", () => {
    it("step 1 (Info)", async () => {
      const { container } = render(<DisputeForm />);
      const results = await axe(container, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
        rules: { "color-contrast": { enabled: false } },
      });
      expect(results).toHaveNoViolations();
    });

    it("step 2 (Details)", async () => {
      const user = userEvent.setup();
      const { container } = render(<DisputeForm />);
      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/order number/i), "ORD-123");
      await user.click(screen.getByTestId("next-button"));
      const results = await axe(container, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
        rules: { "color-contrast": { enabled: false } },
      });
      expect(results).toHaveNoViolations();
    });

    it("step 3 (Evidence)", async () => {
      const user = userEvent.setup();
      const { container } = render(<DisputeForm />);
      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/order number/i), "ORD-123");
      await user.click(screen.getByTestId("next-button"));
      await user.selectOptions(screen.getByLabelText(/reason/i), "damaged_product");
      await user.type(screen.getByLabelText(/description/i), "The item arrived damaged and is unusable");
      await user.click(screen.getByTestId("next-button"));
      const results = await axe(container, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
        rules: { "color-contrast": { enabled: false } },
      });
      expect(results).toHaveNoViolations();
    });

    it("step 4 (Review)", async () => {
      const user = userEvent.setup();
      const { container } = render(<DisputeForm />);
      await user.type(screen.getByLabelText(/name/i), "John Doe");
      await user.type(screen.getByLabelText(/email/i), "john@example.com");
      await user.type(screen.getByLabelText(/order number/i), "ORD-123");
      await user.click(screen.getByTestId("next-button"));
      await user.selectOptions(screen.getByLabelText(/reason/i), "damaged_product");
      await user.type(screen.getByLabelText(/description/i), "The item arrived damaged and is unusable");
      await user.click(screen.getByTestId("next-button"));
      await user.click(screen.getByTestId("next-button"));
      const results = await axe(container, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] },
        rules: { "color-contrast": { enabled: false } },
      });
      expect(results).toHaveNoViolations();
    });
  });
});
