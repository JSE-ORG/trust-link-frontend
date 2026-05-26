"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { getPublicKey, signTransaction, isConnected } from "@stellar/freighter-api";
import { getChallenge, verifyChallenge } from "@/lib/stellar";
import { jwtDecode } from "jwt-decode";

interface WalletContextType {
  publicKey: string | null;
  token: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
  isLoading: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const authenticate = useCallback(async (pubKey: string) => {
    try {
      const challengeXdr = await getChallenge(pubKey);
      const signedXdr = await signTransaction(challengeXdr, {
        network: (process.env.NEXT_PUBLIC_STELLAR_NETWORK as any) || "TESTNET",
      });
      const jwt = await verifyChallenge(signedXdr);
      setToken(jwt);
      setError(null);
    } catch (err: any) {
      console.error("Authentication failed:", err);
      setError(err.message || "Authentication failed");
      setToken(null);
    }
  }, []);

  const connect = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!(await isConnected())) {
        throw new Error("Freighter not found or not connected");
      }
      const pubKey = await getPublicKey();
      setPublicKey(pubKey);
      await authenticate(pubKey);
    } catch (err: any) {
      setError(err.message || "Failed to connect wallet");
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = () => {
    setPublicKey(null);
    setToken(null);
    setError(null);
  };

  // Auto-reauthenticate if token expires
  useEffect(() => {
    if (!token || !publicKey) return;

    try {
      const decoded: any = jwtDecode(token);
      const expirationTime = decoded.exp * 1000;
      const now = Date.now();
      const timeLeft = expirationTime - now;

      if (timeLeft <= 0) {
        authenticate(publicKey);
        return;
      }

      // Refresh 1 minute before expiration
      const timeout = setTimeout(() => {
        authenticate(publicKey);
      }, Math.max(0, timeLeft - 60000));

      return () => clearTimeout(timeout);
    } catch (err) {
      console.error("Token decode failed:", err);
      setToken(null);
    }
  }, [token, publicKey, authenticate]);

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        token,
        connect,
        disconnect,
        isLoading,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
