import React from "react";

/**
 * The ordinal of a wizard step. Narrowed to a literal union so callers cannot
 * pass an out-of-range step and the progress bar stays in sync with the
 * four-step form in `DisputeForm`.
 */
type Step = 1 | 2 | 3 | 4;

/**
 * The wizard's steps in display order. `label` is the visible caption and
 * `step` is the ordinal it corresponds to, which drives the completion test
 * below. Exported shape is internal to this module; adjust here when a step is
 * added or reordered.
 */
const STEPS: ReadonlyArray<{ label: string; step: Step }> = [
  { label: "Step 1: Info", step: 1 },
  { label: "Step 2: Details", step: 2 },
  { label: "Step 3: Evidence", step: 3 },
  { label: "Step 4: Review", step: 4 },
];

/**
 * Props for the DisputeFormProgress component.
 */
export interface DisputeFormProgressProps {
  /** The step the wizard is currently on; steps at or before it render as done. */
  currentStep: Step;
}

/**
 * DisputeFormProgress
 *
 * Horizontal step indicator for the dispute wizard. It is presentational only:
 * steps are non-interactive, so navigation stays owned by
 * `DisputeFormNavigation`. A step is emphasised when `currentStep` has reached
 * or passed it, which reads as a cumulative "everything so far is complete"
 * progression rather than a highlight on the active step alone.
 *
 * @param props - Component properties.
 * @returns The rendered progress indicator.
 */
export function DisputeFormProgress({
  currentStep,
}: DisputeFormProgressProps) {
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
          // Only the active step is the current one; earlier steps are done but
          // are not where the user is, so they must not claim aria-current.
          aria-current={currentStep === step ? "step" : undefined}
        >
          {label}
        </div>
      ))}
    </nav>
  );
}
