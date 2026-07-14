import type { Metadata } from "next";
import { Suspense } from "react";
import VendorOnboardingWizard from "@/components/onboarding/VendorOnboardingWizard";

export const metadata: Metadata = {
  title: "Vendor Onboarding | TrustLink",
  description:
    "Create your vendor profile and start accepting secure escrow payments on the Stellar network.",
};

function OnboardingFallback() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6 animate-pulse">
        {/* Step indicators */}
        <div className="flex justify-center gap-4">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-10 w-10 rounded-full bg-muted" />
          ))}
        </div>
        {/* Card skeleton */}
        <div className="rounded-2xl border bg-card p-8 space-y-4">
          <div className="h-6 w-1/2 rounded bg-muted" />
          <div className="h-4 w-3/4 rounded bg-muted" />
          <div className="h-10 w-full rounded bg-muted" />
          <div className="h-10 w-full rounded bg-muted" />
        </div>
        {/* Button skeleton */}
        <div className="h-11 w-full rounded-lg bg-muted" />
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={<OnboardingFallback />}>
      <VendorOnboardingWizard />
    </Suspense>
  );
}
