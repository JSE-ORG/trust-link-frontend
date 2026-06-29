import { Suspense } from "react";
import VendorOnboardingWizard from "@/components/onboarding/VendorOnboardingWizard";

export const metadata = {
  title: "Vendor Onboarding | TrustLink",
  description: "Create your vendor profile and start accepting secure escrow payments on the Stellar network.",
};

export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <VendorOnboardingWizard />
    </Suspense>
  );
}
