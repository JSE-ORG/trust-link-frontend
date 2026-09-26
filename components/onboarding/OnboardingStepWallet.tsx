"use client";

import { ShieldCheck } from "lucide-react";

import WalletConnectButton from "@/components/wallet/WalletConnectButton";

interface OnboardingStepWalletProps {
  isConnected: boolean;
  publicKey: string | null;
  isInstalled: boolean;
}

export default function OnboardingStepWallet({
  isConnected,
  publicKey,
  isInstalled,
}: OnboardingStepWalletProps) {
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
            {isConnected ? "Connected" : "Not connected"}
          </p>
          {publicKey ? (
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Public key: {publicKey}</p>
          ) : null}
        </div>

        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <WalletConnectButton />
          {!isInstalled ? (
            <p className="text-sm text-warning">Freighter extension not detected. Please install it to continue.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
