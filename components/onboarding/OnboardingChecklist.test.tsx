import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CheckCircle2, ShieldCheck, User } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import OnboardingChecklist from "./OnboardingChecklist";
import type { OnboardingStepMeta } from "./OnboardingStepper";

const steps: OnboardingStepMeta[] = [
  { title: "Connect Wallet", icon: ShieldCheck },
  { title: "Vendor Profile", icon: User },
  { title: "Review & Finish", icon: CheckCircle2 },
];

function renderChecklist(
  overrides: Partial<React.ComponentProps<typeof OnboardingChecklist>> = {}
) {
  return render(
    <OnboardingChecklist
      steps={steps}
      currentStep={1}
      showBack
      showNext
      nextDisabled={false}
      onBack={vi.fn()}
      onNext={vi.fn()}
      onFinish={vi.fn()}
      {...overrides}
    />
  );
}

describe("OnboardingChecklist", () => {
  it("renders the checklist guidance and current step", () => {
    renderChecklist();

    expect(screen.getByText("Onboarding checklist")).toBeInTheDocument();
    expect(screen.getByText(/Step 1: Connect your wallet/)).toBeInTheDocument();
    expect(screen.getByText(/Step 2: Add product and shipping details/)).toBeInTheDocument();
    expect(screen.getByText(/Step 3: Review your store settings/)).toBeInTheDocument();
    expect(screen.getByText("Vendor Profile")).toBeInTheDocument();
  });

  it("shows Continue on the first step and Next on later steps", () => {
    renderChecklist({ currentStep: 0 });
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();

    renderChecklist({ currentStep: 1 });
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
  });

  it("conditionally renders Back and invokes navigation callbacks", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const onNext = vi.fn();
    const { rerender } = renderChecklist({ onBack, onNext });

    await user.tab();
    await user.keyboard("{Enter}");
    expect(onBack).toHaveBeenCalledOnce();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(onNext).toHaveBeenCalledOnce();

    rerender(
      <OnboardingChecklist
        steps={steps}
        currentStep={1}
        showBack={false}
        showNext
        nextDisabled={false}
        onBack={onBack}
        onNext={onNext}
        onFinish={vi.fn()}
      />
    );
    expect(screen.queryByRole("button", { name: "Back" })).not.toBeInTheDocument();
  });

  it("disables Next when required fields are incomplete", () => {
    renderChecklist({ nextDisabled: true });

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
  });

  it("shows Complete Onboarding and invokes onFinish on the final step", async () => {
    const user = userEvent.setup();
    const onFinish = vi.fn();
    renderChecklist({ currentStep: 2, showNext: false, onFinish });

    const finishButton = screen.getByRole("button", { name: "Complete Onboarding" });
    expect(finishButton).toBeEnabled();
    await user.click(finishButton);

    expect(onFinish).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });
});