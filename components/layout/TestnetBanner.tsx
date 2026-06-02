"use client";

import { useNetwork } from "@/components/providers/NetworkProvider";

export default function TestnetBanner() {
  const { isTestnet } = useNetwork();

  if (!isTestnet) return null;

  return (
    <div 
      className="bg-yellow-100 px-4 py-2 text-center text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 border-b border-yellow-200 dark:border-yellow-800"
      role="alert"
    >
      You are on Testnet — funds have no real value
    </div>
  );
}
