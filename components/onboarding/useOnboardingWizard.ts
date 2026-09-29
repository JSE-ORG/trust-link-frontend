"use client";

import { useRouter } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";

import useWallet from "@/hooks/useWallet";

export type OnboardingStep = 0 | 1 | 2;

export interface VendorOnboardingState {
  step: OnboardingStep;
  shopName: string;
  description: string;
  website: string;
  shippingLocations: string;
  completed: boolean;
}

export interface ValidationErrors {
  shopName?: string;
  description?: string;
  website?: string;
}

const STORAGE_KEY = "vendor.onboarding.state";

const defaultState: VendorOnboardingState = {
  step: 0,
  shopName: "",
  description: "",
  website: "",
  shippingLocations: "",
  completed: false,
};

function loadWizardState(): VendorOnboardingState {
  if (typeof window === "undefined") {
    return defaultState;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState, ...JSON.parse(raw) } : defaultState;
  } catch {
    return defaultState;
  }
}

function saveWizardState(state: VendorOnboardingState) {
  if (typeof window === "undefined") {
    return;
  }

  if (state.completed) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function useOnboardingWizard() {
  const router = useRouter();
  const wallet = useWallet();
  const [state, setState] = useState<VendorOnboardingState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [errors, setErrors] = useState<ValidationErrors>({});

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    startTransition(() => {
      setState(loadWizardState());
      setHydrated(true);
    });
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    saveWizardState(state);
  }, [hydrated, state]);

  useEffect(() => {
    if (wallet.isConnected && state.step === 0) {
      startTransition(() => setState((current) => ({ ...current, step: 1 })));
    }
  }, [wallet.isConnected, state.step]);

  const isProfileValid = useMemo(
    () => state.shopName.trim().length > 0 && state.description.trim().length >= 20,
    [state.description, state.shopName]
  );

  const buttonDisabled =
    state.step === 0
      ? !wallet.isConnected
      : state.step === 1
      ? !isProfileValid
      : false;

  const updateField = (field: keyof Omit<VendorOnboardingState, "step" | "completed">, value: string) => {
    setState((current) => ({ ...current, [field]: value }));
    if (errors[field as keyof ValidationErrors]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const normalizeAndValidateUrl = (input: string): string | null => {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const withProto = /^(https?:\/\/)/i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      const parsed = new URL(withProto);
      return parsed.toString();
    } catch {
      return null;
    }
  };

  const validateStep1 = (): boolean => {
    const newErrors: ValidationErrors = {};
    if (!state.shopName.trim()) {
      newErrors.shopName = "Shop name is required.";
    }
    if (!state.description.trim()) {
      newErrors.description = "Description is required.";
    } else if (state.description.trim().length < 20) {
      newErrors.description = "Description must be at least 20 characters.";
    }
    if (state.website && state.website.trim()) {
      const normalized = normalizeAndValidateUrl(state.website);
      if (!normalized) {
        newErrors.website = "Please enter a valid website URL.";
      } else if (normalized !== state.website) {
        setState((current) => ({ ...current, website: normalized }));
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const goToStep = (step: OnboardingStep) => {
    setState((current) => ({ ...current, step }));
  };

  const handleNext = () => {
    if (state.step === 1 && !validateStep1()) {
      return;
    }

    if (buttonDisabled) {
      return;
    }

    setState((current) => ({ ...current, step: Math.min(2, current.step + 1) as OnboardingStep }));
    setErrors({});
  };

  const handleBack = () => {
    setState((current) => ({ ...current, step: Math.max(0, current.step - 1) as OnboardingStep }));
  };

  const handleFinish = () => {
    setState((current) => ({ ...current, completed: true }));
    router.push("/dashboard");
  };

  return {
    wallet,
    state,
    errors,
    isProfileValid,
    buttonDisabled,
    updateField,
    goToStep,
    handleBack,
    handleNext,
    handleFinish,
  };
}
