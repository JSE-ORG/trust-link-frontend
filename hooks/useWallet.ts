import { useCallback, useEffect } from 'react';
import { SESSION_KEY, SESSION_EXPIRED_EVENT, handleSessionExpired } from '../lib/auth/constants';

export interface WalletState {
  address: string | null;
  connected: boolean;
}

export function useWallet(): WalletState {
  const getSession = useCallback((): WalletState => {
    try {
      const session = sessionStorage.getItem(SESSION_KEY) || localStorage.getItem(SESSION_KEY);
      return session ? JSON.parse(session) : { address: null, connected: false };
    } catch {
      return { address: null, connected: false };
    }
  }, []);
import { useContext, useEffect } from "react";

import { WalletContext } from "@/components/providers/WalletProvider";
import { handleSessionExpired } from "@/lib/session";

/**
 * Single source of truth for the localStorage key storing the wallet JWT.
 */
export const SESSION_KEY = "wallet.jwt";

/**
 * Stores the current session-expired handler set by the active `useWallet`.
 * Only one handler can be active at a time; the most recent registration wins.
 */
let sessionExpiredHandler: (() => void) | null = null;

/**
 * Registers a callback to run when the wallet session expires.
 * Returns an unsubscribe function.
 *
 * @param handler - The callback to invoke on session expiry.
 */
export function onSessionExpired(handler: () => void): () => void {
  sessionExpiredHandler = handler;
  return () => {
    if (sessionExpiredHandler === handler) {
      sessionExpiredHandler = null;
    }
  };
}

/**
 * Handles an expired session by delegating to the shared `handleSessionExpired`
 * from `../lib/session`, then notifying the registered handler.
 *
 * Call this from `lib/api/client.ts` when a 401 response is received.
 */
export function handleSessionExpired(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_KEY);
    window.location.assign("/?reason=session_expired");
  }
  handleSessionExpired();
  sessionExpiredHandler?.();
}

/**
 * The single supported entry point for wallet state and actions.
 *
 * Provides access to the current Stellar / Freighter wallet session,
 * including the connected public key, JWT auth token, connection status,
 * and helpers to connect, disconnect, and sign transactions.
 *
 * **Must be rendered inside a <WalletProvider>** -- throws if the
 * context is missing.
 *
 * @returns An object containing:
 *   - `publicKey`       - The connected Stellar public key, or `null` when disconnected.
 *   - `token`          - JWT auth token obtained via SEP-10 challenge/response, or `null`.
 *   - `jwt`            - Alias for the current JWT; always available in memory.
 *   - `isConnected`     - `true` when a public key is present and the wallet is connected.
 *   - `isInstalled`      - `true` when the Freighter browser extension is detected.
 *   - `status`          - Current wallet state:
 *     `loading` | `connected` | `disconnected` | `not-installed` | `error`.
 *   - `connect`         - `() => Promise<boolean>` - Initiates the Freighter connection
 *     and SEP-10 authentication flow. Resolves `true` on success, `false` on failure.
 *   - `disconnect`      - () => void - Clears the session and removes stored credentials.
 *   - `signTransaction` - `(xdr: string, network?: string) => Promise<string>`  - Signs a
 *     Stellar XDR transaction via Freighter. `network` overrides the configured network.
 *   - `isLoading`       - `true` while a connection or auth request is in flight.
 *   - `walletReady`    -  true` once the initial wallet state has been hydrated.
 *   - `error`          - The last `Error` thrown by connect/authenticate, or `null`.
 *
 * @throws {Error} If called outside of a <WalletProvider>.
 *
 * @example
 * ```tsx
 * import useWallet from "@/hooks/useWallet";
 *
 * function ConnectButton() {
 *   const { isConnected, connect, disconnect, isLoading } = useWallet();
 *
 *   return (
 *     <button onClick={isConnected ? disconnect : connect} disabled={isLoading}>
 *       {isLoading ? "Connecting…" : isConnected ? "Disconnect" : "Connect Wallet"}
 *     </button>
 *   );
 * }
 * ```
 *
 * @see {WalletProvider} for the context provider that must wrap your component tree.
 */
export default function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider");
  }

  const clearSession = useCallback((): void => {
    handleSessionExpired();
  }, []);

  useEffect(() => {
    const handleExpired = () => clearSession();
    window.addEventListener(SESSION_EXPIRED_EVENT, handleExpired);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleExpired);
  }, [clearSession]);

  return getSession();
}