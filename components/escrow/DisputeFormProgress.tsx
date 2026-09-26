import React from "react";

type Step = 1 | 2 | 3 | 4;

const STEPS = [
  { label: "Step 1: Info", step: 1 as Step },
  { label: "Step 2: Details", step: 2 as Step },
  { label: "Step 3: Evidence", step: 3 as Step },
  { label: "Step 4: Review", step: 4 as Step },
];

interface Props {
  currentStep: Step;
}

export function DisputeFormProgress({ currentStep }: Props) {
  return (
    <nav
      className="mb-[30px] flex justify-between border-b-2 border-zinc-200 pb-2.5"
      data-testid="progress-indicator"
      aria-label="Form progress"
    >
      {STEPS.map(({ label, step }) => (
        <div
          key={step}
          className={`flex-1 p-2.5 text-center text-sm ${
            currentStep >= step ? "font-bold text-success" : "text-zinc-400"
          }`}
          aria-current={currentStep === step ? "step" : undefined}
        >
          {label}
        </div>
      ))}
    </nav>
  );
}
