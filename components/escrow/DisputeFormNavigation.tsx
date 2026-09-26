import React from "react";

/**
 * The dispute wizard's four steps, in order: dispute details (1), evidence
 * (2), review (3) and submission (4).
 */
type Step = 1 | 2 | 3 | 4;

/**
 * Props for the DisputeFormNavigation component.
 */
export interface DisputeFormNavigationProps {
  /** The step currently on screen. Drives which controls are rendered. */
  currentStep: Step;
  /** True while the dispute is being submitted; disables every control so the form cannot be double-submitted. */
  isSubmitting: boolean;
  /** Moves back one step. Rendered on steps 2 and above only. */
  onBack: () => void;
  /** Advances one step. Rendered on steps 1 to 3. */
  onNext: () => void;
  /** Submits the dispute. Replaces "Next" on the final step. */
  onSubmit: () => void;
}

/** Shared styling for the wizard's Back, Next and Submit controls. */
const BUTTON_CLASS =
  "cursor-pointer rounded bg-success px-5 py-2.5 text-base text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300";

/**
 * Builds a keydown handler that mirrors the control's click behaviour for
 * Enter and Space. A native `<button>` already activates on those keys; the
 * handler is kept explicit so the wizard behaves identically when a control
 * is rendered through a custom skin or asserted directly in tests.
 *
 * @param activate - The action to run when Enter or Space is pressed.
 * @returns A keydown handler that runs `activate` and suppresses the default scroll.
 */
function activateOnKey(activate: () => void) {
  return (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  };
}

/**
 * DisputeFormNavigation
 *
 * Renders the dispute wizard's Back / Next / Submit controls. Back is hidden
 * on the first step, Next becomes Submit on the last, and every control is
 * disabled while a submission is in flight.
 *
 * @param props - Component properties.
 * @returns The rendered navigation controls.
 */
export function DisputeFormNavigation({
  currentStep,
  isSubmitting,
  onBack,
  onNext,
  onSubmit,
}: DisputeFormNavigationProps) {
  return (
    <div className="mt-[30px] flex justify-between">
      {currentStep > 1 && (
        <button
          type="button"
          onClick={onBack}
          onKeyDown={activateOnKey(onBack)}
          disabled={isSubmitting}
          data-testid="back-button"
          className={BUTTON_CLASS}
        >
          Back
        </button>
      )}

      {currentStep < 4 ? (
        <button
          type="button"
          onClick={onNext}
          onKeyDown={activateOnKey(onNext)}
          disabled={isSubmitting}
          data-testid="next-button"
          className={BUTTON_CLASS}
        >
          Next
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          onKeyDown={activateOnKey(onSubmit)}
          disabled={isSubmitting}
          data-testid="submit-button"
          className={BUTTON_CLASS}
        >
          {isSubmitting ? "Submitting..." : "Submit Dispute"}
        </button>
      )}
    </div>
  );
}
