"use client";

import { Link as LinkIcon } from "lucide-react";

import type { OnboardingStepMeta } from "@/components/onboarding/OnboardingStepper";

/**
 * Props for the OnboardingChecklist component.
 * Displays a sidebar checklist during the vendor onboarding flow,
 * showing step descriptions and navigation controls.
 */
interface OnboardingChecklistProps {
  /** Array of step metadata (title + icon) for each onboarding step */
  steps: OnboardingStepMeta[];
  /** Zero-based index of the currently active step */
  currentStep: number;
  /** Whether to show the "Back" navigation button */
  showBack: boolean;
  /** Whether to show the "Next" / "Continue" button (false shows "Complete Onboarding") */
  showNext: boolean;
  /** Disables the next button (e.g. when required fields are incomplete) */
  nextDisabled: boolean;
  /** Callback fired when the user clicks "Back" */
  onBack: () => void;
  /** Callback fired when the user clicks "Next" or "Continue" */
  onNext: () => void;
  /** Callback fired when the user clicks "Complete Onboarding" */
  onFinish: () => void;
}

/**
 * OnboardingChecklist renders a sidebar panel that guides new vendors
 * through the multi-step onboarding process. It displays step
 * descriptions, the current step title, and Back / Next / Finish buttons.
 *
 * @example
 * ```tsx
 * <OnboardingChecklist
 *   steps={steps}
 *   currentStep={1}
 *   showBack={true}
 *   showNext={true}
 *   nextDisabled={false}
 *   onBack={() => goToStep(0)}
 *   onNext={() => goToStep(2)}
 *   onFinish={completeOnboarding}
 * />
 * ```
 */
export default function OnboardingChecklist({
  steps,
  currentStep,
  showBack,
  showNext,
  nextDisabled,
  onBack,
  onNext,
  onFinish,
}: OnboardingChecklistProps) {
  return (
    <aside className="space-y-6 rounded-[2rem] border border-zinc-200 bg-white p-8 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">
        <LinkIcon className="h-4 w-4 text-primary" />
        <span>Onboarding checklist</span>
      </div>
      <div className="space-y-4 text-sm text-zinc-600 dark:text-zinc-400">
        <p>Step 1: Connect your wallet to authenticate and unlock vendor tools.</p>
        <p>Step 2: Add product and shipping details so buyers trust your profile.</p>
        <p>Step 3: Review your store settings and complete setup.</p>
      </div>
      <div className="rounded-3xl bg-zinc-50 p-4 dark:bg-zinc-900">
        <p className="text-xs uppercase tracking-[0.28em] text-zinc-500 dark:text-zinc-400">Current step</p>
        <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">{steps[currentStep].title}</p>
      </div>

      <div className="space-y-3">
        {showBack ? (
          <button
            type="button"
            onClick={onBack}
            className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Back
          </button>
        ) : null}
        {showNext ? (
          <button
            type="button"
            onClick={onNext}
            disabled={nextDisabled}
            className="w-full rounded-full bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {currentStep === 0 ? "Continue" : "Next"}
          </button>
        ) : (
          <button
            type="button"
            onClick={onFinish}
            className="w-full rounded-full bg-success px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
          >
            Complete Onboarding
          </button>
        )}
      </div>
    </aside>
  );
}
