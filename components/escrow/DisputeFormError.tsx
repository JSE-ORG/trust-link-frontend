import React from "react";

/**
 * Props for the DisputeFormError component.
 */
export interface DisputeFormErrorProps {
  /** Human-readable failure reason, taken from the thrown error or the API response. */
  message: string;
  /** Clears the error state and returns the wizard to step 1 so the user can resubmit. */
  onRetry: () => void;
}

/**
 * DisputeFormError
 *
 * Terminal error screen of the dispute wizard. Rendered by `DisputeForm` when
 * submission fails, in place of the step form. Unlike the success screen it uses
 * an assertive live region so a failed submission is announced immediately.
 *
 * @param props - Component properties.
 * @returns The rendered error state.
 */
export function DisputeFormError({
  message,
  onRetry,
}: DisputeFormErrorProps) {
  return (
    <div
      className="mx-auto max-w-[600px] p-10 text-center"
      data-testid="error-state"
      role="alert"
      aria-live="assertive"
    >
      <div className="text-destructive">
        <h2>✗ Submission Failed</h2>
        <p>{message}</p>
        <button
          type="button"
          onClick={onRetry}
          // A native button already activates on Enter and Space; handling it
          // explicitly keeps the retry action reachable when the control is
          // rendered through a custom skin that swaps out the element.
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onRetry();
            }
          }}
          data-testid="try-again-button"
          className="mt-5 cursor-pointer rounded bg-success px-5 py-2.5 text-base text-white transition-colors hover:bg-emerald-700"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
