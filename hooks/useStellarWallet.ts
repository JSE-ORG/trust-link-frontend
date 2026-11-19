"use client";

import { jwtDecode } from "jwt-decode";
import { useCallback,useEffect, useState } from "react";
import { toast } from "sonner";

import { useNetwork } from "@/components/providers/NetworkProvider";
import { captureError, setLoggerUser } from "@/lib/logger";
import {
  getSessionRefreshSchedule,
  handleSessionExpired,
  LEGACY_SESSION_EXPIRED_EVENTS,
  LEGACY_STORAGE_KEYS,
  PUBLIC_KEY_STORAGE_KEY,
  SESSION_EXPIRED_EVENT,
  SESSION_KEY,
  type SessionRefreshSchedule,
} from "@/lib/session";
import { getChallenge, verifyChallenge } from "@/lib/stellar";
import {
  connectFreighter,
  isConnected as freighterIsConnected,
  isFreighterInstalled,
  signTransaction as freighterSignTransaction,
} from "@/lib/stellar/freighter";

export type WalletStatus = "loading" | "connected" | "disconnected" | "not-installed" | "error";

interface JwtPayload {
  /** Expiry in seconds since the epoch. Optional: the backend is the only
   *  thing that guarantees it, so a missing or non-numeric claim is a case
   *  the refresh schedule has to handle rather than assume away. */
  exp?: number;
  sub?: string;
  iat?: number;
}



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
        localStorage.setItem(SESSION_KEY, jwt);
      }
      return jwt;
    } catch (err: unknown) {
      console.error("Authentication failed:", err);
      captureError(err, { scope: "auth", action: "authenticate" });
      toast.error("Authentication failed");
      throw err;
    }
  }, [network]);

  /**
   * Drops every trace of the connected wallet: React state, the logger
   * identity and the persisted credentials. `error` is left untouched so the
   * caller can keep its own message, and a later `connect()` recovers without
   * a reload.
   */
  const clearIdentity = useCallback(() => {
    setPublicKey(null);
    setToken(null);
    setLoggerUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(PUBLIC_KEY_STORAGE_KEY);
      localStorage.removeItem(SESSION_KEY);
      for (const key of LEGACY_STORAGE_KEYS) {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch {
          // ignore storage errors in restricted contexts
        }
      }
    }
  }, []);

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
            clearIdentity();
          }
        } catch (e) {
          captureError(e, { scope: "wallet", action: "restoreSession" });
          // The stored key was adopted above before the challenge was
          // verified. Roll it back rather than presenting an authenticated
          // wallet that holds no token.
          clearIdentity();
        }
      }
      if (!isMounted) return;
      setIsLoading(false);
      setWalletReady(true);
    }
    init();
    return () => { isMounted = false; };
  }, [authenticate, clearIdentity]);

  useEffect(() => {
    const onUnauthorized = () => {
      if (token || publicKey) {
        clearIdentity();
      }
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onUnauthorized);
    for (const legacyEvent of LEGACY_SESSION_EXPIRED_EVENTS) {
      window.addEventListener(legacyEvent, onUnauthorized);
    }
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onUnauthorized);
      for (const legacyEvent of LEGACY_SESSION_EXPIRED_EVENTS) {
        window.removeEventListener(legacyEvent, onUnauthorized);
      }
    };
  }, [token, publicKey, clearIdentity]);

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

      try {
        await authenticate(pubKey);
      } catch (err) {
        // The public key, the logger identity and the persisted key were all
        // committed before the signature was verified. Undo them so a rejected
        // authentication leaves nothing behind for the retry to trip over.
        clearIdentity();
        throw err;
      }

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
  }, [authenticate, clearIdentity]);

  const disconnect = useCallback(() => {
    clearIdentity();
    toast.success("Wallet disconnected");
  }, [clearIdentity]);

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

    let schedule: SessionRefreshSchedule;
    try {
      schedule = getSessionRefreshSchedule(jwtDecode<JwtPayload>(token).exp);
    } catch (err) {
      // `jwtDecode` throws outright for anything that is not a JWT.
      captureError(err, { scope: "auth", action: "decodeSessionToken" });
      schedule = { kind: "unusable", reason: "invalid-expiry" };
    }

    if (schedule.kind === "unusable") {
      // A lapsed or unreadable `exp` can never be renewed on a timer:
      // scheduling that re-signed immediately, and every replacement token
      // restarted the effect. End in a defined disconnected state instead.
      //
      // The teardown runs from a timer rather than straight from the effect
      // body so it does not cascade renders; a zero-delay *teardown* cannot
      // loop the way the old zero-delay *renewal* did, because it clears the
      // token the effect depends on.
      const { reason } = schedule;
      const expiry = setTimeout(() => {
        captureError(new Error(`Session token cannot be refreshed: ${reason}`), {
          scope: "auth",
          action: "scheduleSessionRefresh",
        });
        clearIdentity();
        handleSessionExpired();
        setError("Session expired. Reconnect your wallet.");
      }, 0);

      return () => clearTimeout(expiry);
    }

    const timeout = setTimeout(() => {
      // `authenticate` rejects whenever the challenge, the signature or the
      // verification fails. Catch it on the timer so the renewal never becomes
      // an unhandled rejection, and so an unrenewable session ends
      // disconnected rather than sitting on a stale token.
      void authenticate(publicKey).catch((err: unknown) => {
        captureError(err, { scope: "auth", action: "refreshSession" });
        clearIdentity();
        handleSessionExpired();
        setError("Session expired. Reconnect your wallet.");
      });
    }, schedule.delayMs);

    return () => clearTimeout(timeout);
  }, [token, publicKey, authenticate, clearIdentity]);

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
