import React, { createContext, type ReactNode, useState } from "react";

import { WalletContext, type WalletContextType } from "@/components/providers/WalletProvider";

export interface MockWalletOptions {
  status?: "loading" | "connected" | "disconnected" | "not-installed" | "error";
  publicKey?: string | null;
  token?: string | null;
  jwt?: string | null;
  isInstalled?: boolean;
  isLoading?: boolean;
  walletReady?: boolean;
  error?: Error | null;
  connect?: () => Promise<boolean>;
  disconnect?: () => void;
  signTransaction?: (xdr: string, network?: string) => Promise<string>;
}

export interface MockWalletProviderProps extends MockWalletOptions {
  children: ReactNode;
}

export const MOCK_WALLET_PUBLIC_KEY = "GBTEST1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ";
export const MOCK_WALLET_TOKEN = "mock_storybook_jwt_token";

export function MockWalletProvider({
  children,
  status = "connected",
  publicKey,
  token,
  jwt,
  isInstalled,
  isLoading,
  walletReady,
  error,
  connect,
  disconnect,
  signTransaction,
}: MockWalletProviderProps) {
  const [internalStatus, setInternalStatus] = useState<WalletContextType["status"]>(status);

  const activeStatus = internalStatus;
  const isConnected = activeStatus === "connected";
  const effectiveInstalled = isInstalled ?? (activeStatus !== "not-installed");
  const effectiveLoading = isLoading ?? (activeStatus === "loading");
  const effectiveReady = walletReady ?? (!effectiveLoading);
  const effectivePublicKey =
    publicKey !== undefined
      ? publicKey
      : isConnected
        ? MOCK_WALLET_PUBLIC_KEY
        : null;
  const effectiveToken =
    token !== undefined
      ? token
      : isConnected
        ? MOCK_WALLET_TOKEN
        : null;
  const effectiveJwt = jwt ?? effectiveToken;
  const effectiveError =
    error !== undefined
      ? error
      : activeStatus === "error"
        ? new Error("Simulated wallet connection error")
        : null;

  const mockConnect =
    connect ??
    (async () => {
      setInternalStatus("connected");
      return true;
    });

  const mockDisconnect =
    disconnect ??
    (() => {
      setInternalStatus("disconnected");
    });

  const mockSignTransaction =
    signTransaction ??
    (async (xdr: string) => {
      return "mock_signed_xdr_" + (xdr || "default");
    });

  const contextValue: WalletContextType = {
    publicKey: effectivePublicKey,
    token: effectiveToken,
    jwt: effectiveJwt,
    isConnected,
    isInstalled: effectiveInstalled,
    status: activeStatus,
    connect: mockConnect,
    disconnect: mockDisconnect,
    signTransaction: mockSignTransaction,
    isLoading: effectiveLoading,
    walletReady: effectiveReady,
    error: effectiveError,
  };

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
}

export default MockWalletProvider;
