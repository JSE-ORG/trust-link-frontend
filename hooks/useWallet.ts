"use client";

import { useContext } from "react";

import { WalletContext, type WalletContextType } from "@/components/providers/WalletProvider";

export { SESSION_KEY } from "@/lib/session";
export type { WalletContextType, WalletContextType as WalletState };

/**
 * Access the canonical wallet context and actions.
 * Must be used within a `WalletProvider`.
 */
export function useWallet(): WalletContextType {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}

export default useWallet;
export const useWalletContext = useWallet;
