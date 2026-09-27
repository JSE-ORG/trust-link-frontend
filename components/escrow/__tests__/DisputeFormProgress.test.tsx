import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DisputeFormProgress } from "../DisputeFormProgress";

const STEP_LABELS = [
  "Step 1: Info",
  "Step 2: Details",
  "Step 3: Evidence",
  "Step 4: Review",
];

function renderProgress(currentStep: 1 | 2 | 3 | 4) {
  render(<DisputeFormProgress currentStep={currentStep} />);
  return STEP_LABELS.map((label) => screen.getByText(label));
}

describe("DisputeFormProgress", () => {
  it("renders the indicator as a labelled navigation region", () => {
    renderProgress(1);

    const nav = screen.getByTestId("progress-indicator");
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveAccessibleName("Form progress");
  });

  it("renders all four steps in order", () => {
    renderProgress(1);

    const container = screen.getByTestId("progress-indicator");
    expect(
      Array.from(container.children).map((child) => child.textContent)
    ).toEqual(STEP_LABELS);
  });

  it("marks only the active step with aria-current", () => {
    const steps = renderProgress(3);

    expect(steps[2]).toHaveAttribute("aria-current", "step");
    expect(steps[0]).not.toHaveAttribute("aria-current");
    expect(steps[1]).not.toHaveAttribute("aria-current");
    expect(steps[3]).not.toHaveAttribute("aria-current");
  });

  it("highlights the current step and every completed step", () => {
    const steps = renderProgress(2);

    expect(steps[0].className).toContain("text-success");
    expect(steps[1].className).toContain("text-success");
    expect(steps[1].className).toContain("font-bold");
    expect(steps[2].className).toContain("text-zinc-400");
    expect(steps[3].className).toContain("text-zinc-400");
  });

  it("dims every step but the first when the wizard has just started", () => {
    const steps = renderProgress(1);

    expect(steps[0].className).toContain("text-success");
    steps.slice(1).forEach((step) => {
      expect(step.className).toContain("text-zinc-400");
      expect(step).not.toHaveAttribute("aria-current");
    });
  });

  it("highlights all steps on the final step", () => {
    const steps = renderProgress(4);

    steps.forEach((step) => expect(step.className).toContain("text-success"));
    expect(steps[3]).toHaveAttribute("aria-current", "step");
  });

  it("does not expose the steps as interactive controls", () => {
    renderProgress(2);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
