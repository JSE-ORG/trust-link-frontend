"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";

interface OnboardingStepCompleteProps {
  onGoToDashboard: () => void;
}

export default function OnboardingStepComplete({
  onGoToDashboard,
}: OnboardingStepCompleteProps) {
  return (
    <div className="rounded-[2rem] border border-zinc-200 bg-white p-10 text-center shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10 text-success">
        <CheckCircle2 className="h-10 w-10" />
      </div>
      <h2 className="text-3xl font-semibold text-zinc-950 dark:text-white">Onboarding Complete</h2>
      <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">
        Your vendor profile is saved and ready to use. You can now manage escrows and ship orders from your dashboard.
      </p>
      <button
        type="button"
        onClick={onGoToDashboard}
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-900 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        Go to Dashboard <ArrowRight className="h-4 w-4" />
      </button>
    </div>
  );
}
