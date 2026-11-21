"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useNetwork } from "@/components/providers/NetworkProvider";
import ThemeToggle from "@/components/ui/ThemeToggle";
import WalletConnectButton from "@/components/wallet/WalletConnectButton";
import { CORE_NAV, isNavigationActive } from "@/lib/navigation";

/**
 * Site navigation bar.
 *
 * CLS notes:
 * - The <header> has an explicit h-14 (56 px) height so the sticky bar never
 *   changes size between the server-rendered shell and after hydration.
 * - The network toggle button has a min-w-[88px] so its width is stable
 *   regardless of whether it shows "Mainnet" (shorter) or "Testnet" (longer).
 * - WalletConnectButton renders a compact variant that strictly preserves the 56px height.
 */
export default function Navbar() {
  const pathname = usePathname();
  const { toggleNetwork, isMainnet } = useNetwork();

  return (
    <header className="sticky top-0 z-50 w-full h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-full items-center justify-between gap-3 px-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="font-bold text-zinc-950 dark:text-white hover:opacity-90 transition-opacity">
            TrustLink
          </Link>
        </div>

        <nav aria-label="Desktop navigation" className="hidden min-w-0 flex-1 items-center justify-center gap-1 md:flex">
          {CORE_NAV.map(({ href, label }) => {
            const active = isNavigationActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`whitespace-nowrap rounded-lg px-2 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 lg:px-3 lg:text-sm ${
                  active
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <div className="hidden md:flex items-center">
            <WalletConnectButton variant="navbar" />
          </div>
          <button
            type="button"
            onClick={toggleNetwork}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                toggleNetwork();
              }
            }}
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
