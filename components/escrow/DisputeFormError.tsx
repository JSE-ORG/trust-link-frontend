import React from "react";

interface Props {
  message: string;
  onRetry: () => void;
}

export function DisputeFormError({ message, onRetry }: Props) {
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
