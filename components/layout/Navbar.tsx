"use client";

import { useNetwork } from "@/components/providers/NetworkProvider";

export default function Navbar() {
  const { network, toggleNetwork, isMainnet } = useNetwork();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="font-bold">TrustLink</span>
        </div>
        <button
          type="button"
          onClick={toggleNetwork}
          className="flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          role="switch"
          aria-checked={isMainnet}
          aria-label={`Switch to ${isMainnet ? "Testnet" : "Mainnet"}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              isMainnet ? "bg-green-500" : "bg-yellow-500"
            }`}
            aria-hidden="true"
          />
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
            {isMainnet ? "Mainnet" : "Testnet"}
          </span>
        </button>
      </div>
    </header>
  );
}
