"use client";

import {
  CheckCircle2,
  ShieldCheck,
  User,
} from "lucide-react";

import OnboardingChecklist from "@/components/onboarding/OnboardingChecklist";
import OnboardingStepComplete from "@/components/onboarding/OnboardingStepComplete";
import OnboardingStepper, {
  type OnboardingStepMeta,
} from "@/components/onboarding/OnboardingStepper";
import OnboardingStepProfile from "@/components/onboarding/OnboardingStepProfile";
import OnboardingStepReview from "@/components/onboarding/OnboardingStepReview";
import OnboardingStepWallet from "@/components/onboarding/OnboardingStepWallet";
import {
  type OnboardingStep,
  useOnboardingWizard,
} from "@/components/onboarding/useOnboardingWizard";

const steps: OnboardingStepMeta[] = [
  { title: "Connect Wallet", icon: ShieldCheck },
  { title: "Vendor Profile", icon: User },
  { title: "Review & Finish", icon: CheckCircle2 },
];

export default function VendorOnboardingWizard() {
  const {
    wallet,
    state,
    errors,
    buttonDisabled,
    updateField,
    goToStep,
    handleBack,
    handleNext,
    handleFinish,
  } = useOnboardingWizard();

  const stepContent = () => {
    if (state.completed) {
      return <OnboardingStepComplete onGoToDashboard={handleFinish} />;
    }

    if (state.step === 0) {
      return (
        <OnboardingStepWallet
          isConnected={wallet.isConnected}
          publicKey={wallet.publicKey}
          isInstalled={wallet.isInstalled}
        />
      );
    }

    if (state.step === 1) {
      return (
        <OnboardingStepProfile
          shopName={state.shopName}
          description={state.description}
          website={state.website}
          shippingLocations={state.shippingLocations}
          errors={errors}
          onChange={updateField}
        />
      );
    }

    return (
      <OnboardingStepReview
        shopName={state.shopName}
        description={state.description}
        website={state.website}
        shippingLocations={state.shippingLocations}
      />
    );
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
        <OnboardingStepper
          steps={steps}
          currentStep={state.step}
          completed={state.completed}
          onGoToStep={(step) => goToStep(step as OnboardingStep)}
        />

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>{stepContent()}</div>

          <OnboardingChecklist
            steps={steps}
            currentStep={state.step}
            showBack={state.step > 0}
            showNext={state.step < 2}
            nextDisabled={buttonDisabled}
            onBack={handleBack}
            onNext={handleNext}
            onFinish={handleFinish}
          />
        </div>
      </div>
    </div>
  );
}
