"use client";

import { useEffect, useRef, useState } from "react";
import useWallet from "@/hooks/useWallet";
import { truncateAddress } from "@/utils/truncateAddress";
import { ChevronDown, LogOut, Wallet, ExternalLink } from "lucide-react";

export default function WalletConnectButton() {
  const { isConnected, publicKey, isInstalled, connect, disconnect, isLoading, error } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!isInstalled) {
    return (
      <a
        href="https://freighter.app"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-warning px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90"
      >
        <ExternalLink size={16} />
        Install Freighter
      </a>
    );
  }

  if (!isConnected) {
    return (
      <button
        type="button"
        onClick={connect}
        disabled={isLoading}
        className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-900 disabled:opacity-60"
      >
        <Wallet size={18} />
        {isLoading ? "Connecting..." : "Connect Wallet"}
      </button>
    );
  }

  return (
    <div className="relative inline-flex" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
        <span>{publicKey ? truncateAddress(publicKey, 5, 4) : "Connected"}</span>
        <ChevronDown size={16} className={isOpen ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-56 overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950">
          <div className="space-y-1 p-3">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Account</p>
            <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">{publicKey}</p>
            {error ? <p className="text-xs text-destructive">{error}</p> : null}
          </div>
          <div className="border-t border-zinc-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => {
                disconnect();
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              role="menuitem"
            >
              <LogOut size={16} className="inline-block mr-2" />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
