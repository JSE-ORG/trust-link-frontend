/**
 * Session constants and helpers shared by the wallet,
 * API clients, and dashboard.
 *
 * This module is the single source of truth for:
 *   - the localStorage key used to persist the SEP-10 JWT
 *   - the event name dispatched when a session expires
 *   - the redirect target used after a session expires
 *   - the handler that clears every session-related key
 *     and notifies listeners
 */

/** The localStorage key that holds the SEP-10 JWT. */
export const SESSION_KEY = "wallet.jwt" as const;

/** The localStorage key that holds the connected public key. */
export const PUBLIC_KEY_STORAGE_KEY = "wallet.publicKey" as const;

/** Event dispatched on `window` when the session expires. */
export const SESSION_EXPIRED_EVENT = "app:unauthorized" as const;

/** The single redirect target used when a session expires. */
export const SESSION_EXPIRED_REDIRECT = "/" as const;

/** All localStorage keys that must be cleared on session expiry. */
export const SESSION_STORAGE_KEYS = [SESSION_KEY, PUBLIC_KEY_STORAGE_KEY] as const;

/**
 * Clears every session-related localStorage key and notifies listeners.
 *
 * This is the single entry point for handling a 401 / expired session.
 * It is safe to call in any environment; browser-only side effects are
 * guarded by a `typeof window` check.
 */
export function handleSessionExpired(): void {
  if (typeof window === "undefined") return;

  for (const key of SESSION_STORAGE_KEYS) {
    window.localStorage.removeItem(key);
  }

  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}
