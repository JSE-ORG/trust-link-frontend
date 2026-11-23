"use client";

import { ChevronDown, Copy, ExternalLink, LogOut, Wallet } from "lucide-react";
import { useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { NetworkContext } from "@/components/providers/NetworkProvider";
import { Skeleton } from "@/components/ui/Skeleton";
import useWallet from "@/hooks/useWallet";
import { getStellarExpertAccountUrl } from "@/lib/explorer";
import { truncateAddress } from "@/utils/truncateAddress";

export interface WalletConnectButtonProps {
  /**
   * Rendering style:
   * - "default": Standard larger button with generous padding for hero/step cards.
   * - "navbar": Compact variant aligned for fixed h-14 (56px) navigation headers without CLS.
   */
  variant?: "default" | "navbar";
  className?: string;
}

export default function WalletConnectButton({
  variant = "default",
  className = "",
}: WalletConnectButtonProps) {
  const {
    isConnected,
    publicKey,
    isInstalled,
    connect,
    disconnect,
    isLoading,
    walletReady,
    error,
  } = useWallet();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const networkContext = useContext(NetworkContext);

  const isNavbar = variant === "navbar";

  const handleCopyAddress = async () => {
    if (!publicKey) return;
    try {
      await navigator.clipboard.writeText(publicKey);
      toast.success("Address copied to clipboard");
    } catch {
      toast.error("Failed to copy address");
    }
  };

  const explorerUrl = publicKey
    ? getStellarExpertAccountUrl(publicKey, networkContext?.network)
    : "";

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

  if (!walletReady) {
    return (
      <Skeleton
        className={isNavbar ? "h-8 w-28 rounded-full" : "h-10 w-40 rounded-full"}
        aria-hidden
      />
    );
  }

  if (!isInstalled) {
    return (
      <a
        href="https://freighter.app"
        target="_blank"
        rel="noopener noreferrer"
        className={
          isNavbar
            ? `inline-flex h-8 items-center gap-1.5 rounded-full bg-warning px-3 text-xs font-semibold text-white shadow-sm transition hover:opacity-90 ${className}`
            : `inline-flex items-center gap-2 rounded-full bg-warning px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:opacity-90 ${className}`
        }
      >
        <ExternalLink size={isNavbar ? 14 : 16} />
        Install Freighter
      </a>
    );
  }

  if (!isConnected) {
    if (isLoading) {
      return (
        <Skeleton
          className={isNavbar ? "h-8 w-28 rounded-full" : "h-11 w-40 rounded-full"}
          aria-hidden
        />
      );
    }

    return (
      <button
        type="button"
        onClick={connect}
        className={
          isNavbar
            ? `inline-flex h-8 items-center gap-1.5 rounded-full bg-zinc-900 px-3.5 text-xs font-semibold text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 cursor-pointer ${className}`
            : `inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-semibold text-white transition hover:bg-zinc-900 cursor-pointer ${className}`
        }
      >
        <Wallet size={isNavbar ? 14 : 18} />
        Connect Wallet
      </button>
    );
  }

  const truncated = publicKey ? truncateAddress(publicKey, 4, 4) : "Connected";

  return (
    <div className={`relative inline-flex ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className={
          isNavbar
            ? "inline-flex h-8 items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            : "inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm font-medium text-zinc-900 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-900 cursor-pointer"
        }
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <span className="h-2 w-2 rounded-full bg-green-500 shrink-0" aria-hidden="true" />
        <span>{truncated}</span>
        <ChevronDown
          size={isNavbar ? 14 : 16}
          className={isOpen ? "rotate-180 transition-transform" : "transition-transform"}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-950 z-50"
        >
          <div className="space-y-1 p-3">
            <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Account</p>
            <p
              className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100"
              title={publicKey ?? ""}
            >
              {publicKey}
            </p>
            {error ? <p className="text-xs text-destructive">{error.message}</p> : null}
          </div>
          <div className="border-t border-zinc-100 dark:border-zinc-800 p-1 space-y-0.5">
            <button
              type="button"
              role="menuitem"
              onClick={handleCopyAddress}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none dark:text-zinc-300 dark:hover:bg-zinc-900 dark:focus:bg-zinc-900 cursor-pointer"
            >
              <Copy size={16} />
              Copy Address
            </button>
            {publicKey ? (
              <a
                role="menuitem"
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none dark:text-zinc-300 dark:hover:bg-zinc-900 dark:focus:bg-zinc-900 cursor-pointer"
              >
                <ExternalLink size={16} />
                View on Stellar Expert
              </a>
            ) : null}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                disconnect();
                setIsOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-700 transition hover:bg-zinc-100 focus:bg-zinc-100 focus:outline-none dark:text-zinc-300 dark:hover:bg-zinc-900 dark:focus:bg-zinc-900 cursor-pointer"
            >
              <LogOut size={16} />
              Disconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
