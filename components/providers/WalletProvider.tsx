"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { 
  signTransaction as freighterSignTransaction, 
  isConnected as freighterIsConnected, 
  isFreighterInstalled, 
  connectFreighter 
} from "@/lib/stellar/freighter";
import { getChallenge, verifyChallenge } from "@/lib/stellar";
import { toast } from "sonner";
import { jwtDecode } from "jwt-decode";

interface WalletContextType {
  publicKey: string | null;
  token: string | null;
  isConnected: boolean;
  isInstalled: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signTransaction: (xdr: string, network?: string) => Promise<string>;
  isLoading: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

const PUBLIC_KEY_STORAGE_KEY = "wallet.publicKey";
const TOKEN_STORAGE_KEY = "wallet.token";

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const authenticate = useCallback(async (pubKey: string) => {
    try {
      const challengeXdr = await getChallenge(pubKey);
      const stellarNetwork = process.env.NEXT_PUBLIC_STELLAR_NETWORK || "TESTNET";
      const signedXdr = await freighterSignTransaction(challengeXdr, stellarNetwork);
      const jwt = await verifyChallenge(signedXdr);
      setToken(jwt);
      if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_STORAGE_KEY, jwt);
      }
      return jwt;
    } catch (err: any) {
      console.error("Authentication failed:", err);
      toast.error("Authentication failed");
      throw err;
    }
  }, []);

  // Check if Freighter is installed and restore session
  useEffect(() => {
    async function init() {
      const installed = await isFreighterInstalled();
      setIsInstalled(installed);
      
      const storedPublicKey = typeof window !== "undefined" ? localStorage.getItem(PUBLIC_KEY_STORAGE_KEY) : null;
      const storedToken = typeof window !== "undefined" ? localStorage.getItem(TOKEN_STORAGE_KEY) : null;
      
      if (storedPublicKey && installed) {
        try {
          const connected = await freighterIsConnected();
          if (connected) {
            setPublicKey(storedPublicKey);
            if (storedToken) {
              setToken(storedToken);
            } else {
              await authenticate(storedPublicKey);
            }
          } else {
            if (typeof window !== "undefined") {
              localStorage.removeItem(PUBLIC_KEY_STORAGE_KEY);
              localStorage.removeItem(TOKEN_STORAGE_KEY);
            }
          }
        } catch (e) {
          console.error("Failed to restore session:", e);
        }
      }
      setIsLoading(false);
    }
    init();
  }, [authenticate]);

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const installed = await isFreighterInstalled();
      if (!installed) {
        toast.error("Freighter is not installed");
        throw new Error("Freighter not installed");
      }

      const pubKey = await connectFreighter();
      setPublicKey(pubKey);
      if (typeof window !== "undefined") {
        localStorage.setItem(PUBLIC_KEY_STORAGE_KEY, pubKey);
      }
      
      await authenticate(pubKey);
      
      toast.success("Wallet connected");
    } catch (err: any) {
      const message = err.message || "Failed to connect wallet";
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [authenticate]);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setToken(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(PUBLIC_KEY_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    toast.success("Wallet disconnected");
  }, []);

  const signTransaction = useCallback(async (xdr: string, network?: string) => {
    try {
      const stellarNetwork = network || process.env.NEXT_PUBLIC_STELLAR_NETWORK || "TESTNET";
      const signedXdr = await freighterSignTransaction(xdr, stellarNetwork);
      return signedXdr;
    } catch (err: any) {
      const message = err.message || "Failed to sign transaction";
      toast.error(message);
      throw err;
    }
  }, []);

  // Auto-refresh token if it expires
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

      const timeout = setTimeout(() => {
        authenticate(publicKey);
      }, Math.max(0, timeLeft - 300000));

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
        isConnected: !!publicKey,
        isInstalled,
        connect,
        disconnect,
        signTransaction,
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
