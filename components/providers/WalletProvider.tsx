"use client";

import { jwtDecode } from "jwt-decode";
import { createContext, type ReactNode, useCallback, useEffect, useRef, useState } from "react";
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
import { connectFreighter, isConnected as freighterIsConnected, isFreighterInstalled, signTransaction as freighterSignTransaction } from "@/lib/stellar/freighter";

export interface WalletContextType {
  publicKey: string | null;
  token: string | null;
  jwt: string | null;
  isConnected: boolean;
  isInstalled: boolean;
  status: "loading" | "connected" | "disconnected" | "not-installed" | "error";
  connect: () => Promise<boolean>;
  disconnect: () => void;
  signTransaction: (xdr: string, network?: string) => Promise<string>;
  isLoading: boolean;
  walletReady: boolean;
  error: Error | null;
}

export const WalletContext = createContext<WalletContextType | undefined>(undefined);
interface JwtPayload { exp?: number }

export function WalletProvider({ children }: { children: ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [walletReady, setWalletReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { network } = useNetwork();
  const tokenRef = useRef<string | null>(null);
  const stellarNetwork = network === "mainnet" ? "PUBLIC" : "TESTNET";

  const authenticate = useCallback(async (key: string) => {
    try {
      const challenge = await getChallenge(key);
      const signed = await freighterSignTransaction(challenge, stellarNetwork);
      const jwt = await verifyChallenge(signed);
      setToken(jwt);
      localStorage.setItem(SESSION_KEY, jwt);
      return jwt;
    } catch (caught) {
      captureError(caught, { scope: "auth", action: "authenticate" });
      toast.error("Authentication failed");
      throw caught;
    }
  }, [stellarNetwork]);

  /**
   * Drops every trace of the connected wallet — React state, the logger
   * identity and the persisted credentials — without announcing a session
   * expiry. `error` is deliberately left alone so the UI can still say why the
   * connection failed, and a later `connect()` recovers without a reload.
   */
  const clearIdentity = useCallback(() => {
    setToken(null);
    setPublicKey(null);
    tokenRef.current = null;
    setLoggerUser(null);
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
  }, []);

  const clearWallet = useCallback(() => {
    clearIdentity();
    handleSessionExpired();
  }, [clearIdentity]);

  useEffect(() => { tokenRef.current = token; }, [token]);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const installed = await isFreighterInstalled();
      if (!mounted) return;
      setIsInstalled(installed);
      const storedKey = localStorage.getItem(PUBLIC_KEY_STORAGE_KEY);
      if (storedKey && installed && (await freighterIsConnected()).isConnected) {
        setPublicKey(storedKey);
        setLoggerUser(storedKey);
        try {
          await authenticate(storedKey);
        } catch (caught) {
          captureError(caught, { scope: "wallet", action: "restoreSession" });
          // The stored key was adopted above before the challenge was
          // verified. Roll it back rather than presenting an authenticated
          // wallet that holds no token.
          clearIdentity();
        }
      }
      if (mounted) { setIsLoading(false); setWalletReady(true); }
    })();
    return () => { mounted = false; };
  }, [authenticate, clearIdentity]);

  useEffect(() => {
    const onUnauthorized = () => {
      if (tokenRef.current || publicKey) {
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
  }, [clearIdentity, publicKey]);

  useEffect(() => {
    if (!token || !publicKey) return;

    let schedule: SessionRefreshSchedule;
    try {
      schedule = getSessionRefreshSchedule(jwtDecode<JwtPayload>(token).exp);
    } catch (caught) {
      // `jwtDecode` throws outright for anything that is not a JWT.
      captureError(caught, { scope: "auth", action: "decodeSessionToken" });
      schedule = { kind: "unusable", reason: "invalid-expiry" };
    }

    if (schedule.kind === "unusable") {
      // A lapsed or unreadable `exp` can never be renewed on a timer:
      // scheduling that re-signed immediately, and every replacement token
      // restarted the effect. End in a defined expired state instead.
      //
      // The teardown runs from a timer rather than straight from the effect
      // body so it does not cascade renders; a zero-delay *teardown* cannot
      // loop the way the old zero-delay *renewal* did, because it clears the
      // token the effect depends on.
      const { reason } = schedule;
      const expiry = window.setTimeout(() => {
        captureError(new Error(`Session token cannot be refreshed: ${reason}`), {
          scope: "auth",
          action: "scheduleSessionRefresh",
        });
        clearWallet();
      }, 0);

      return () => window.clearTimeout(expiry);
    }

    const timeout = window.setTimeout(() => {
      // `authenticate` rejects whenever the challenge, the signature or the
      // verification fails. Catch it on the timer so the renewal never becomes
      // an unhandled rejection, and so an unrenewable session ends expired
      // rather than sitting on a stale token.
      void authenticate(publicKey).catch((caught: unknown) => {
        captureError(caught, { scope: "auth", action: "refreshSession" });
        clearWallet();
      });
    }, schedule.delayMs);

    return () => window.clearTimeout(timeout);
  }, [token, publicKey, authenticate, clearWallet]);

  const connect = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (!await isFreighterInstalled()) throw new Error("Freighter is not installed");
      const key = await connectFreighter();
      setPublicKey(key);
      setLoggerUser(key);
      localStorage.setItem(PUBLIC_KEY_STORAGE_KEY, key);
      try {
        await authenticate(key);
      } catch (caught) {
        // The public key, the logger identity and the persisted key were all
        // committed before the signature was verified. Undo them so a rejected
        // authentication leaves nothing behind for the retry to trip over.
        clearIdentity();
        throw caught;
      }
      toast.success("Wallet connected");
      return true;
    } catch (caught) {
      const nextError = caught instanceof Error ? caught : new Error("Failed to connect wallet");
      setError(nextError);
      toast.error(nextError.message);
      return false;
    } finally { setIsLoading(false); }
  }, [authenticate, clearIdentity]);

  const disconnect = useCallback(() => {
    clearIdentity();
    toast.success("Wallet disconnected");
  }, [clearIdentity]);

  const signTransaction = useCallback((xdr: string, networkOverride?: string) => freighterSignTransaction(xdr, networkOverride || stellarNetwork), [stellarNetwork]);
  const status = isLoading ? "loading" : publicKey ? "connected" : !isInstalled ? "not-installed" : error ? "error" : "disconnected";

  return <WalletContext.Provider value={{ publicKey, token, jwt: token, isConnected: Boolean(publicKey), isInstalled, status, connect, disconnect, signTransaction, isLoading, walletReady, error }}>{children}</WalletContext.Provider>;
}

export default WalletProvider;
