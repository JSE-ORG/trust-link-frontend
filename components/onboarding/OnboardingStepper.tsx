"use client";

import { Sparkles } from "lucide-react";

export interface OnboardingStepMeta {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface OnboardingStepperProps {
  steps: OnboardingStepMeta[];
  currentStep: number;
  completed: boolean;
  onGoToStep: (step: number) => void;
}

export default function OnboardingStepper({
  steps,
  currentStep,
  completed,
  onGoToStep,
}: OnboardingStepperProps) {
  return (
    <div className="rounded-[2.5rem] bg-primary/5 p-8 shadow-2xl ring-1 ring-primary/10 dark:bg-zinc-950/70 dark:ring-white/10">
      <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">Vendor onboarding</p>
          <h1 className="mt-4 text-4xl font-bold text-zinc-950 dark:text-white">Create your store profile and ship with confidence.</h1>
          <p className="mt-4 max-w-2xl text-base text-zinc-600 dark:text-zinc-300">
            A simple multi-step onboarding wizard helps new vendors connect wallet, enter business details, and review before launch.
          </p>
        </div>
        <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
              <Sparkles className="h-5 w-5 text-success" />
              <span>Progress is saved automatically as you work.</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {steps.map((stepItem, index) => {
                const isActive = index === currentStep;
                const isDone = index < currentStep || completed;
                const StepIcon = stepItem.icon;

                return (
                  <button
                    key={stepItem.title}
                    type="button"
                    onClick={() => onGoToStep(index)}
                    className={`rounded-3xl border p-4 text-left transition ${
                      isActive
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <StepIcon className="h-4 w-4" />
                      <span>{stepItem.title}</span>
                    </div>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                      {isDone ? "Completed" : isActive ? "Current step" : "Pending"}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
