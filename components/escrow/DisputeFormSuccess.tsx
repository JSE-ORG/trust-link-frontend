import React from "react";

interface Props {
  message: string;
  onReset: () => void;
}

export function DisputeFormSuccess({ message, onReset }: Props) {
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
