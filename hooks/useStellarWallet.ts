"use client";

import type { WalletContextType } from "@/components/providers/WalletProvider";
import useWallet from "@/hooks/useWallet";

export type WalletStatus = "loading" | "connected" | "disconnected" | "not-installed" | "error";

export interface StellarWalletState {
  publicKey: string | null;
  token: string | null;
  isInstalled: boolean;
  isLoading: boolean;
  walletReady: boolean;
  error: string | null;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  signTransaction: (xdr: string, networkOverride?: string) => Promise<string>;
}

/**
 * @deprecated Legacy hook. Prefer `useWallet` from `@/hooks/useWallet`.
 *
 * Adapts the canonical `WalletProvider` lifecycle behind the legacy hook signature
 * without running duplicate timers, event listeners, or Freighter connection attempts.
 */
export function useStellarWallet(): StellarWalletState {
  const wallet = useWallet();

  return {
    publicKey: wallet.publicKey,
    token: wallet.token,
    isInstalled: wallet.isInstalled,
    isLoading: wallet.isLoading,
    walletReady: wallet.walletReady,
    error: wallet.error ? wallet.error.message : null,
    connect: wallet.connect,
    disconnect: wallet.disconnect,
    signTransaction: wallet.signTransaction,
  };
}

export default useStellarWallet;
