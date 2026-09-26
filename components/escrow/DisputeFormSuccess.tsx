import React from "react";

/**
 * Props for the DisputeFormSuccess component.
 */
export interface DisputeFormSuccessProps {
  /** Confirmation text shown to the user, normally echoed from the submit response. */
  message: string;
  /** Resets the wizard so the user can file another dispute. */
  onReset: () => void;
}

/**
 * DisputeFormSuccess
 *
 * Terminal screen of the dispute wizard. Announces the outcome to assistive
 * technology through a polite live region, echoes the confirmation message
 * returned by the API, and offers a reset action to start a new dispute.
 *
 * @param props - Component properties.
 * @returns The rendered success state.
 */
export function DisputeFormSuccess({
  message,
  onReset,
}: DisputeFormSuccessProps) {
  return (
    <div
      className="mx-auto max-w-[600px] p-10 text-center"
      data-testid="success-state"
      role="status"
      aria-live="polite"
    >
      <div className="text-success">
        <h2>✓ Dispute Submitted Successfully!</h2>
        <p>{message}</p>
        <p>
          We will review your dispute and get back to you within 3-5 business
          days.
        </p>
        <button
          type="button"
          onClick={onReset}
          // A native button already activates on Enter and Space; handling it
          // explicitly keeps the reset action reachable when the control is
          // rendered through a custom skin that swaps out the element.
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onReset();
            }
          }}
          data-testid="new-dispute-button"
          className="mt-5 cursor-pointer rounded bg-success px-5 py-2.5 text-base text-white transition-colors hover:bg-emerald-700"
        >
          Submit Another Dispute
        </button>
      </div>
    </div>
  );
}
