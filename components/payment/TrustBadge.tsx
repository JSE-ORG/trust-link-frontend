"use client";

import React, { useState } from "react";
import { Shield, Copy, ExternalLink, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { truncateAddress } from "@/utils/truncateAddress";
import { getStellarExpertUrl } from "@/lib/explorer";
import { useNetwork } from "@/components/providers/NetworkProvider";

interface TrustBadgeProps {
  contractAddress: string;
  className?: string;
}

export function TrustBadge({ contractAddress, className }: TrustBadgeProps) {
  const [copied, setCopied] = useState(false);
  const { network } = useNetwork();

  const handleCopy = async () => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(contractAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  const explorerUrl = getStellarExpertUrl(contractAddress, network);

  return (
    <div 
      className={cn(
        "flex w-full flex-col sm:flex-row items-start sm:items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400">
          <Shield className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Funds Protected by Smart Contract
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            Escrow contract automatically handles release
          </span>
        </div>
      </div>

      <div className="mt-3 flex w-full sm:mt-0 sm:w-auto items-center gap-2 border-t border-emerald-100 pt-3 sm:border-none sm:pt-0 dark:border-emerald-900/50">
        <div className="flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-950">
          <span 
            className="font-mono text-xs text-zinc-600 dark:text-zinc-400 select-all mr-2 cursor-help"
            title={contractAddress}
          >
            {truncateAddress(contractAddress, 4, 4)}
          </span>
          
          <div className="flex items-center gap-1 border-l border-zinc-200 pl-2 dark:border-zinc-800">
            <button
              type="button"
              onClick={handleCopy}
              className="rounded p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              title="Copy address"
              aria-label="Copy address"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded p-1 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              title="View on Stellar Expert"
              aria-label="View on Stellar Expert"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
