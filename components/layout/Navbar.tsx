"use client";

import { useNetwork } from "@/components/providers/NetworkProvider";
import ThemeToggle from "@/components/ui/ThemeToggle";

/**
 * Site navigation bar.
 *
 * CLS notes:
 * - The <header> has an explicit h-14 (56 px) height so the sticky bar never
 *   changes size between the server-rendered shell and after hydration.
 * - The network toggle button has a min-w-[88px] so its width is stable
 *   regardless of whether it shows "Mainnet" (shorter) or "Testnet" (longer).
 *   Without this, the width change shifts neighbouring items and can contribute
 *   to CLS during the brief window between SSR and hydration.
 */
export default function Navbar() {
  const { toggleNetwork, isMainnet } = useNetwork();

  return (
    <header className="sticky top-0 z-50 w-full h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-full items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="font-bold">TrustLink</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleNetwork}
            className="flex items-center gap-2 px-3 py-1 min-w-[88px] rounded-full border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            role="switch"
            aria-checked={isMainnet}
            aria-label={`Switch to ${isMainnet ? "Testnet" : "Mainnet"}`}
          >
            <span
              className={`h-2 w-2 flex-shrink-0 rounded-full ${
                isMainnet ? "bg-green-500" : "bg-yellow-500"
              }`}
              aria-hidden="true"
            />
            <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
              {isMainnet ? "Mainnet" : "Testnet"}
            </span>
          </button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
