"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import {
  getPublicKey,
  signTransaction as freighterSignTransaction,
  isFreighterInstalled,
} from "@/lib/stellar/freighter";
import { getChallenge, verifyChallenge } from "@/lib/stellar";
import { setApiToken } from "@/lib/api";
import { jwtDecode } from "jwt-decode";

export type WalletStatus =
  | "disconnected"
  | "connecting"
  | "connected"
  | "not-installed"
  | "error";

interface WalletContextType {
  publicKey: string | null;
  jwt: string | null;
  token: string | null;
  isConnected: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (transaction: string, networkPassphrase: string) => Promise<string>;
  isLoading: boolean;
  error: string | null;
  status: WalletStatus;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [jwt, setJwt] = useState<string | null>(null);
  const [status, setStatus] = useState<WalletStatus>("disconnected");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authenticate = useCallback(
    async (pubKey: string) => {
      const challengeXdr = await getChallenge(pubKey);
      const signedXdr = await freighterSignTransaction(challengeXdr, {
        network: process.env.NEXT_PUBLIC_STELLAR_NETWORK || "TESTNET",
      });
      const token = await verifyChallenge(signedXdr);
      setJwt(token);
      setApiToken(token);
      setError(null);
      setStatus("connected");
      return token;
    },
    []
  );

  const connect = useCallback(async () => {
    setIsLoading(true);
    setStatus("connecting");
    setError(null);

    try {
      if (!(await isFreighterInstalled())) {
        setStatus("not-installed");
        throw new Error("Freighter is not installed");
      }

      const pubKey = await getPublicKey();
      setPublicKey(pubKey);
      await authenticate(pubKey);
    } catch (err: any) {
      const message = err?.message || "Failed to connect wallet";
      setError(message);
      if (message === "Freighter is not installed") {
        setStatus("not-installed");
      } else {
        setStatus("error");
      }
      setJwt(null);
      setApiToken(null);
    } finally {
      setIsLoading(false);
    }
  }, [authenticate]);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setJwt(null);
    setApiToken(null);
    setError(null);
    setStatus("disconnected");
    setIsLoading(false);
  }, []);

  const signTransaction = useCallback(
    async (transaction: string, networkPassphrase: string) => {
      return freighterSignTransaction(transaction, networkPassphrase);
    },
    []
  );

  useEffect(() => {
    if (!jwt || !publicKey) return;

    try {
      const decoded: any = jwtDecode(jwt);
      const expirationTime = decoded.exp * 1000;
      const now = Date.now();
      const timeLeft = expirationTime - now;

      if (timeLeft <= 0) {
        authenticate(publicKey);
        return;
      }

      const timeout = setTimeout(() => {
        authenticate(publicKey);
      }, Math.max(0, timeLeft - 60000));

      return () => clearTimeout(timeout);
    } catch (err) {
      console.error("Token decode failed:", err);
      setJwt(null);
      setApiToken(null);
    }
  }, [jwt, publicKey, authenticate]);

  const isConnected = Boolean(publicKey && jwt);

  const value = useMemo(
    () => ({
      publicKey,
      jwt,
      token: jwt,
      isConnected,
      connect,
      disconnect,
      signTransaction,
      isLoading,
      error,
      status,
    }),
    [publicKey, jwt, isConnected, connect, disconnect, signTransaction, isLoading, error, status]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
