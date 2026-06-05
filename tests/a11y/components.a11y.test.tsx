import React from "react";
import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { axe, toHaveNoViolations } from "jest-axe";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/Skeleton";
import EmptyVendorState from "@/components/dashboard/EmptyVendorState";

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
});
