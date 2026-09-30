"use client";

import { jwtDecode } from "jwt-decode";
import { useCallback,useEffect, useState } from "react";
import { toast } from "sonner";

import { useNetwork } from "@/components/providers/NetworkProvider";
import { captureError, setLoggerUser } from "@/lib/logger";
import { getChallenge, verifyChallenge } from "@/lib/stellar";
import {
  connectFreighter,
  isConnected as freighterIsConnected,
  isFreighterInstalled,
  signTransaction as freighterSignTransaction,
} from "@/lib/stellar/freighter";

export type WalletStatus = "loading" | "connected" | "disconnected" | "not-installed" | "error";

interface JwtPayload {
  exp: number;
  sub?: string;
  iat?: number;
}

const PUBLIC_KEY_STORAGE_KEY = "wallet.publicKey";
const TOKEN_STORAGE_KEY = "wallet.token";

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

export function useStellarWallet() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [walletReady, setWalletReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { network } = useNetwork();

  const stellarNetworkLabel = network === "mainnet" ? "PUBLIC" : "TESTNET";

  const authenticate = useCallback(async (pubKey: string) => {
    try {
      const challengeXdr = await getChallenge(pubKey);
      const net = network === "mainnet" ? "PUBLIC" : "TESTNET";
      const signedXdr = await freighterSignTransaction(challengeXdr, net);
      const jwt = await verifyChallenge(signedXdr);
      setToken(jwt);
      if (typeof window !== "undefined") {
        localStorage.setItem(TOKEN_STORAGE_KEY, jwt);
      }
      return jwt;
    } catch (err: unknown) {
      console.error("Authentication failed:", err);
      captureError(err, { scope: "auth", action: "authenticate" });
      toast.error("Authentication failed");
      throw err;
    }
  }, [network]);

  useEffect(() => {
    let isMounted = true;

    async function init() {
      const installed = await isFreighterInstalled();
      if (!isMounted) return;
      setIsInstalled(installed);

      const storedPublicKey = typeof window !== "undefined" ? localStorage.getItem(PUBLIC_KEY_STORAGE_KEY) : null;
      if (storedPublicKey && installed) {
        try {
          // `isConnected()` resolves to `{ isConnected }` — awaiting it and
          // testing the result is always truthy, which would restore a stale
          // session for an uninstalled wallet.
          const { isConnected: connected } = (await freighterIsConnected()) ?? { isConnected: false };
          if (!isMounted) return;
          if (connected) {
            setPublicKey(storedPublicKey);
            setLoggerUser(storedPublicKey);
            await authenticate(storedPublicKey);
          } else {
            if (typeof window !== "undefined") {
              localStorage.removeItem(PUBLIC_KEY_STORAGE_KEY);
              localStorage.removeItem(TOKEN_STORAGE_KEY);
            }
          }
        } catch (e) {
          captureError(e, { scope: "wallet", action: "restoreSession" });
        }
      }
      if (!isMounted) return;
      setIsLoading(false);
      setWalletReady(true);
    }
    init();
    return () => { isMounted = false; };
  }, [authenticate]);

  const connect = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const installed = await isFreighterInstalled();
      if (!installed) {
        toast.error("Freighter is not installed");
        setError("Freighter is not installed");
        return false;
      }

      const pubKey = await connectFreighter();
      setPublicKey(pubKey);
      setLoggerUser(pubKey);
      if (typeof window !== "undefined") {
        localStorage.setItem(PUBLIC_KEY_STORAGE_KEY, pubKey);
      }

      await authenticate(pubKey);

      toast.success("Wallet connected");
      return true;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(message);
      toast.error(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [authenticate]);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setToken(null);
    setLoggerUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(PUBLIC_KEY_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    toast.success("Wallet disconnected");
  }, []);

  const signWalletTransaction = useCallback(async (xdr: string, networkOverride?: string) => {
    try {
      const net = networkOverride || stellarNetworkLabel;
      const signedXdr = await freighterSignTransaction(xdr, net);
      return signedXdr;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to sign transaction";
      toast.error(message);
      throw err;
    }
  }, [stellarNetworkLabel]);

  useEffect(() => {
    if (!token || !publicKey) return;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const expirationTime = decoded.exp * 1000;
      const now = Date.now();
      const timeLeft = expirationTime - now;

      if (timeLeft <= 0) {
        const id = setTimeout(() => authenticate(publicKey), 0);
        return () => clearTimeout(id);
      }

      const timeout = setTimeout(() => {
        authenticate(publicKey);
      }, Math.max(0, timeLeft - 300000));

      return () => clearTimeout(timeout);
    } catch (err) {
      captureError(err, { scope: "auth", action: "decodeSessionToken" });
      setTimeout(() => setToken(null), 0);
    }
  }, [token, publicKey, authenticate]);

  return {
    publicKey,
    token,
    isInstalled,
    isLoading,
    walletReady,
    error,
    connect,
    disconnect,
    signTransaction: signWalletTransaction,
  };
}
