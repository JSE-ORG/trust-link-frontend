"use client";

import { useState, useRef, useEffect } from "react";
import useWallet from "@/hooks/useWallet";
import { truncateAddress } from "@/utils/truncateAddress";
import { ChevronDown, LogOut, Wallet, ExternalLink } from "lucide-react";

export default function WalletConnectButton() {
  const { isConnected, publicKey, isInstalled, connect, disconnect, isLoading } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle keyboard navigation
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
        className="flex items-center gap-2 rounded-3xl bg-amber-100 px-4 py-2 text-sm font-semibold text-amber-900 transition hover:bg-amber-200"
      >
        <ExternalLink size={16} />
        Install Freighter
      </a>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={() => connect()}
        disabled={isLoading}
        className="flex items-center gap-2 rounded-3xl bg-black px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-zinc-900 disabled:opacity-60"
      >
        <Wallet size={18} />
        {isLoading ? "Connecting..." : "Connect Wallet"}
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-3xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-900 transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="h-2 w-2 rounded-full bg-green-500" />
        <span>{truncateAddress(publicKey!, 5, 4)}</span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-2xl border border-zinc-200 bg-white p-1 shadow-xl outline-none dark:border-zinc-800 dark:bg-zinc-950">
          <button
            onClick={() => {
              disconnect();
              setIsOpen(false);
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
            role="menuitem"
          >
            <LogOut size={16} />
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}
