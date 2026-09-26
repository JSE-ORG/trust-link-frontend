import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import OnboardingStepComplete from "./OnboardingStepComplete";

describe("OnboardingStepComplete", () => {
  it("renders the completion message and dashboard action", () => {
    render(<OnboardingStepComplete onGoToDashboard={vi.fn()} />);

    expect(screen.getByRole("heading", { name: "Onboarding Complete" })).toBeInTheDocument();
    expect(
      screen.getByText(/Your vendor profile is saved and ready to use/)
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to Dashboard" })).toBeEnabled();
  });

  it("calls onGoToDashboard when the action is clicked", async () => {
    const user = userEvent.setup();
    const onGoToDashboard = vi.fn();
    render(<OnboardingStepComplete onGoToDashboard={onGoToDashboard} />);

    await user.click(screen.getByRole("button", { name: "Go to Dashboard" }));

    expect(onGoToDashboard).toHaveBeenCalledOnce();
  });

  it("supports keyboard activation of the dashboard action", async () => {
    const user = userEvent.setup();
    const onGoToDashboard = vi.fn();
    render(<OnboardingStepComplete onGoToDashboard={onGoToDashboard} />);

    await user.tab();
    await user.keyboard("{Enter}");

    expect(onGoToDashboard).toHaveBeenCalledOnce();
  });
});