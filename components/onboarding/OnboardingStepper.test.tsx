import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckCircle2, ShieldCheck, User } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import OnboardingStepper, { type OnboardingStepMeta } from "./OnboardingStepper";

const steps: OnboardingStepMeta[] = [
  { title: "Connect Wallet", icon: ShieldCheck },
  { title: "Vendor Profile", icon: User },
  { title: "Review & Finish", icon: CheckCircle2 },
];

describe("OnboardingStepper", () => {
  it("renders the onboarding introduction and each step", () => {
    render(
      <OnboardingStepper
        steps={steps}
        currentStep={1}
        completed={false}
        onGoToStep={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: /Create your store profile/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Connect Wallet/ })).toHaveTextContent("Completed");
    expect(screen.getByRole("button", { name: /Vendor Profile/ })).toHaveTextContent("Current step");
    expect(screen.getByRole("button", { name: /Review & Finish/ })).toHaveTextContent("Pending");
  });

  it("marks earlier steps complete and invokes navigation for the selected step", async () => {
    const onGoToStep = vi.fn();
    const user = userEvent.setup();

    render(
      <OnboardingStepper
        steps={steps}
        currentStep={2}
        completed={false}
        onGoToStep={onGoToStep}
      />
    );

    expect(screen.getByRole("button", { name: /Connect Wallet/ })).toHaveTextContent("Completed");
    expect(screen.getByRole("button", { name: /Vendor Profile/ })).toHaveTextContent("Completed");
    await user.click(screen.getByRole("button", { name: /Vendor Profile/ }));

    expect(onGoToStep).toHaveBeenCalledOnce();
    expect(onGoToStep).toHaveBeenCalledWith(1);
  });

  it("marks every step complete after onboarding is finished", () => {
    render(
      <OnboardingStepper
        steps={steps}
        currentStep={0}
        completed
        onGoToStep={vi.fn()}
      />
    );

    for (const step of steps) {
      expect(screen.getByRole("button", { name: new RegExp(step.title) })).toHaveTextContent("Completed");
    }
  });

  it("renders safely when there are no steps", () => {
    render(
      <OnboardingStepper
        steps={[]}
        currentStep={0}
        completed={false}
        onGoToStep={vi.fn()}
      />
    );

    expect(screen.getByText("Vendor onboarding")).toBeInTheDocument();
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });
});