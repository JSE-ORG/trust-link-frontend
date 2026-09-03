import React from "react";

type Step = 1 | 2 | 3 | 4;

interface Props {
  currentStep: Step;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function DisputeFormNavigation({
  currentStep,
  isSubmitting,
  onBack,
  onNext,
  onSubmit,
}: Props) {
  return (
    <div className="mt-[30px] flex justify-between">
      {currentStep > 1 && (
        <button
          type="button"
          onClick={onBack}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onBack();
            }
          }}
          disabled={isSubmitting}
          data-testid="back-button"
          className="cursor-pointer rounded bg-success px-5 py-2.5 text-base text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          Back
        </button>
      )}

      {currentStep < 4 ? (
        <button
          type="button"
          onClick={onNext}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onNext();
            }
          }}
          disabled={isSubmitting}
          data-testid="next-button"
          className="cursor-pointer rounded bg-success px-5 py-2.5 text-base text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          Next
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onSubmit();
            }
          }}
          disabled={isSubmitting}
          data-testid="submit-button"
          className="cursor-pointer rounded bg-success px-5 py-2.5 text-base text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          {isSubmitting ? "Submitting..." : "Submit Dispute"}
        </button>
      )}
    </div>
  );
}
