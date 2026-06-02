"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CheckCircle2,
  Link as LinkIcon,
  ShieldCheck,
  Sparkles,
  Truck,
  User,
} from "lucide-react";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";
import useWallet from "@/hooks/useWallet";

type OnboardingStep = 0 | 1 | 2;

interface VendorOnboardingState {
  step: OnboardingStep;
  shopName: string;
  description: string;
  website: string;
  shippingLocations: string;
  completed: boolean;
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

const steps = [
  { title: "Connect Wallet", icon: ShieldCheck },
  { title: "Vendor Profile", icon: User },
  { title: "Review & Finish", icon: CheckCircle2 },
];

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

export default function VendorOnboardingWizard() {
  const router = useRouter();
  const wallet = useWallet();
  const [state, setState] = useState<VendorOnboardingState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    setState(loadWizardState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    saveWizardState(state);
  }, [hydrated, state]);

  useEffect(() => {
    if (wallet.isConnected && state.step === 0) {
      setState((current) => ({ ...current, step: 1 }));
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
  };

  const goToStep = (step: OnboardingStep) => {
    setState((current) => ({ ...current, step }));
  };

  const handleNext = () => {
    if (buttonDisabled) {
      return;
    }

    setState((current) => ({ ...current, step: Math.min(2, current.step + 1) }));
  };

  const handleBack = () => {
    setState((current) => ({ ...current, step: Math.max(0, current.step - 1) }));
  };

  const handleFinish = () => {
    setState((current) => ({ ...current, completed: true }));
    router.push("/dashboard");
  };

  const stepContent = () => {
    if (state.completed) {
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
            onClick={() => router.push("/dashboard")}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-900 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      );
    }

    if (state.step === 0) {
      return (
        <div className="rounded-[2rem] border border-zinc-200 bg-white p-10 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-6 flex flex-col items-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-3xl font-semibold text-zinc-950 dark:text-white">Connect Your Wallet</h2>
              <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
                Connect your Stellar wallet to prove identity and continue onboarding as a vendor.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Connection status</p>
              <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">
                {wallet.isConnected ? "Connected" : "Not connected"}
              </p>
              {wallet.publicKey ? (
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Public key: {wallet.publicKey}</p>
              ) : null}
            </div>

            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <WalletConnectButton />
              {!wallet.isInstalled ? (
                <p className="text-sm text-warning">Freighter extension not detected. Please install it to continue.</p>
              ) : null}
            </div>
          </div>
        </div>
      );
    }

    if (state.step === 1) {
      return (
        <form className="rounded-[2rem] border border-zinc-200 bg-white p-10 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
          <div className="mb-8">
            <h2 className="text-3xl font-semibold text-zinc-950 dark:text-white">Vendor Profile</h2>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
              Share your business details so buyers can trust your store.
            </p>
          </div>

          <div className="space-y-6">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Shop name
              <input
                id="shop-name"
                name="shopName"
                value={state.shopName}
                onChange={(event) => updateField("shopName", event.target.value)}
                className="mt-2 w-full rounded-3xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="Example: Stellar Craft Co."
                required
              />
            </label>

            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Description
              <textarea
                id="shop-description"
                name="description"
                value={state.description}
                onChange={(event) => updateField("description", event.target.value)}
                rows={5}
                className="mt-2 w-full rounded-3xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                placeholder="Tell buyers why they should choose your products."
                required
              />
            </label>

            <div className="grid gap-6 md:grid-cols-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Website
                <input
                  id="shop-website"
                  name="website"
                  value={state.website}
                  onChange={(event) => updateField("website", event.target.value)}
                  className="mt-2 w-full rounded-3xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  placeholder="https://"
                />
              </label>

              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Shipping destinations
                <input
                  id="shipping-locations"
                  name="shippingLocations"
                  value={state.shippingLocations}
                  onChange={(event) => updateField("shippingLocations", event.target.value)}
                  className="mt-2 w-full rounded-3xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
                  placeholder="Worldwide, US only, EU only"
                />
              </label>
            </div>

            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Description must be at least 20 characters.
            </p>
          </div>
        </form>
      );
    }

    return (
      <div className="rounded-[2rem] border border-zinc-200 bg-white p-10 shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-8">
          <h2 className="text-3xl font-semibold text-zinc-950 dark:text-white">Review Your Store</h2>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Confirm the details before you complete onboarding.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Shop name</p>
            <p className="mt-3 text-base font-semibold text-zinc-950 dark:text-white">{state.shopName || "Not provided"}</p>
          </div>
          <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Shipping destinations</p>
            <p className="mt-3 text-base font-semibold text-zinc-950 dark:text-white">{state.shippingLocations || "Worldwide"}</p>
          </div>
          <div className="sm:col-span-2 rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Description</p>
            <p className="mt-3 text-base leading-7 text-zinc-950 dark:text-white">{state.description || "No description yet."}</p>
          </div>
          <div className="sm:col-span-2 rounded-3xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Website</p>
            <p className="mt-3 text-base text-zinc-950 dark:text-white">{state.website || "Not listed"}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-10">
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
                    const isActive = index === state.step;
                    const isCompleted = index < state.step || state.completed;
                    const StepIcon = stepItem.icon;

                    return (
                      <button
                        key={stepItem.title}
                        type="button"
                        onClick={() => goToStep(index as OnboardingStep)}
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
                          {isCompleted ? "Completed" : isActive ? "Current step" : "Pending"}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div>{stepContent()}</div>

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
              <p className="mt-2 text-lg font-semibold text-zinc-950 dark:text-white">{steps[state.step].title}</p>
            </div>

            <div className="space-y-3">
              {state.step > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-full rounded-full border border-zinc-300 bg-white px-4 py-3 text-sm font-semibold text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
                >
                  Back
                </button>
              ) : null}
              {state.step < 2 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={buttonDisabled}
                  className="w-full rounded-full bg-black px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  {state.step === 0 ? "Continue" : "Next"}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  className="w-full rounded-full bg-success px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  Complete Onboarding
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
