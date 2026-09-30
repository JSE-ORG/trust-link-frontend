import React, { createContext, useContext, useMemo, ReactNode } from 'react';
import { useWallet, WalletState } from '../../hooks/useWallet';
import { SESSION_KEY } from '../../lib/auth/constants';

const WalletContext = createContext<WalletState | null>(null);

import { useNetwork } from "@/components/providers/NetworkProvider";
import { SESSION_KEY } from "@/hooks/useWallet";
import { captureError, setLoggerUser } from "@/lib/logger";
import { getChallenge, verifyChallenge } from "@/lib/stellar";
import {
  connectFreighter,
  isConnected as freighterIsConnected,
  isFreighterInstalled,
  signTransaction as freighterSignTransaction,
} from "@/lib/stellar/freighter";
export function WalletProvider({ children }: { children: ReactNode }): JSX.Element {
  const wallet = useWallet();
  const value = useMemo(() => wallet, [wallet]);

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

const PUBLIC_KEY_STORAGE_KEY = "wallet.publicKey";
const UNAUTHORIZED_EVENT = "auth:unauthorized";

interface WalletContextType {
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

/**
 * Internal wallet context. Not meant to be consumed directly outside this module — components should use {useWallet} from `"@/hooks/useWallet`,
 * which is the single supported entry point for wallet state and actions.
 */
export const WalletContext = createContext<WalletContextType | undefined>(
  undefined
);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [walletReady, setWalletReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { network } = useNetwork();

  const tokenRef = useRef<string | null>(null);
  const publicKeyRef = useRef<string | null>(null);

  useEffect(() => { tokenRef.current = token; }, [token]);
  useEffect(() => { publicKeyRef.current = publicKey; }, [publicKey]);

  const stellarNetworkLabel = network === "mainnet" ? "PUBLIC" : "TESTNET";

  const authenticate = useCallback(
    async (pubKey: string) => {
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
    },
    [network]
  );

  useEffect(() => {
    let isMounted = true;

    async function init() {
      const installed = await isFreighterInstalled();
      if (!isMounted) return;
      setIsInstalled(installed);

      const storedPublicKey =
        typeof window !== "undefined"
          ? localStorage.getItem(PUBLIC_KEY_STORAGE_KEY)
          : null;
      if (storedPublicKey && installed) {
        try {
          const connected = await freighterIsConnected();
          if (!isMounted) return;
          if (connected) {
            setPublicKey(storedPublicKey);
            setLoggerUser(storedPublicKey);
            await authenticate(storedPublicKey);
          } else {
            if (typeof window !== "undefined") {
              localStorage.removeItem(PUBLIC_KEY_STORAGE_KEY);
              localStorage.removeItem(SESSION_KEY);
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
    return () => {
      isMounted = false;
    };
  }, [authenticate]);

  const connect = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const installed = await isFreighterInstalled();
      if (!installed) {
        toast.error("Freighter is not installed");
        setError(new Error("Freighter is not installed"));
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
      const message =
        err instanceof Error ? err.message : "Failed to connect wallet";
      setError(new Error(message));
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
      localStorage.removeItem(SESSION_KEY);
    }
    toast.success("Wallet disconnected");
  }, []);

  const signWalletTransaction = useCallback(
    async (xdr: string, networkOverride?: string) => {
      try {
        const net = networkOverride || stellarNetworkLabel;
        const signedXdr = await freighterSignTransaction(xdr, net);
        return signedXdr;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to sign transaction";
        toast.error(message);
        throw err;
      }
    },
    [stellarNetworkLabel]
  );

  const handleUnauthorized = useCallback(() => {
    if (!tokenRef.current) return;

    tokenRef.current = null;
    publicKeyRef.current = null;
    setToken(null);
    setPublicKey(null);
    setLoggerUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(PUBLIC_KEY_STORAGE_KEY);
      localStorage.removeItem(SESSION_KEY);
    }
    toast.error("Session expired. Please reconnect your wallet.");
  }, []);

  useEffect(() => {
    const handleUnauthorizedEvent = () => {
      handleUnauthorized();
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorizedEvent);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorizedEvent);
  }, [handleUnauthorized]);

  useEffect(() => {
    if (!token || !publicKey) return;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const expirationTime = decoded.exp * 1000;
      const now = Date.now();
      const timeLeft = expirationTime - now;

      if (timeLeft <= 0) {
        handleUnauthorized();
        return;
      }

      const timeout = setTimeout(() => {
        authenticate(publicKey);
      }, Math.max(0, timeLeft - 300000));

      return () => clearTimeout(timeout);
    } catch (err) {
      captureError(err, { scope: "auth", action: "decodeSessionToken" });
      handleUnauthorized();
    }
  }, [token, publicKey, authenticate, handleUnauthorized]);

  const status: WalletContextType["status"] = isLoading
    ? "loading"
    : publicKey
      ? "connected"
      : !isInstalled
        ? "not-installed"
        : error
          ? "error"
          : "disconnected";
export function useWalletContext(): WalletState {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWalletContext must be used within WalletProvider');
  return context;
}

export function setWalletSession(session: WalletState): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearWalletSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(SESSION_KEY);
}
