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

/** Canonical event dispatched on `window` when the session expires. */
export const SESSION_EXPIRED_EVENT = "app:unauthorized" as const;

/** Legacy session events dispatched or listened to by older components. */
export const LEGACY_SESSION_EXPIRED_EVENTS = [
  "app:session_expired",
  "auth:unauthorized",
] as const;

/** The single redirect target used when a session expires. */
export const SESSION_EXPIRED_REDIRECT = "/" as const;

/** Legacy session storage keys that must be explicitly cleaned up without erasing unrelated preferences. */
export const LEGACY_STORAGE_KEYS = [
  "wallet.token",
  "wallet.jwk",
  "wallet.session",
] as const;

/** All localStorage keys that must be cleared on session expiry. */
export const SESSION_STORAGE_KEYS = [
  SESSION_KEY,
  PUBLIC_KEY_STORAGE_KEY,
  ...LEGACY_STORAGE_KEYS,
] as const;

/**
 * Clears every session-related localStorage and sessionStorage key and notifies listeners.
 *
 * This is the single entry point for handling a 401 / expired session.
 * It is safe to call in any environment; browser-only side effects are
 * guarded by a `typeof window` check.
 */
export function handleSessionExpired(): void {
  if (typeof window === "undefined") return;

  for (const key of SESSION_STORAGE_KEYS) {
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  // Explicit narrow cleanup for legacy keys stored in sessionStorage
  for (const key of LEGACY_STORAGE_KEYS) {
    try {
      window.sessionStorage.removeItem(key);
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));

  for (const legacyEvent of LEGACY_SESSION_EXPIRED_EVENTS) {
    window.dispatchEvent(new Event(legacyEvent));
  }
}

/**
 * How long before a session JWT expires its renewal is scheduled.
 *
 * Renewing early keeps in-flight requests from racing the expiry, at the cost
 * of signing a new challenge slightly sooner than strictly necessary.
 */
export const SESSION_REFRESH_LEAD_MS = 5 * 60 * 1000;

/**
 * Floor on any scheduled refresh delay.
 *
 * Subtracting {@link SESSION_REFRESH_LEAD_MS} from a token that has less than
 * five minutes left yields a negative delay. Clamping that at zero makes the
 * renewal fire immediately, and because every renewal replaces the token — and
 * so reschedules this effect — a backend handing out short-lived tokens turns
 * into an unbroken stream of zero-delay signing requests, each one a Freighter
 * prompt. A floor keeps the retry rate bounded no matter how short the token
 * is; the trade-off is that a token with under 30 seconds left is refreshed
 * just after it lapses rather than just before.
 */
export const MIN_SESSION_REFRESH_DELAY_MS = 30 * 1000;

/**
 * What to do with a session token: renew it after `delayMs`, or treat it as
 * unusable. `reason` distinguishes a token that has simply lapsed from one
 * whose `exp` claim could not be read at all.
 */
export type SessionRefreshSchedule =
  | { kind: "refresh"; delayMs: number }
  | { kind: "unusable"; reason: "expired" | "invalid-expiry" };

/**
 * Decides when — or whether — a session JWT should be renewed.
 *
 * Kept free of React and of the wallet adapters so both wallet implementations
 * schedule renewals identically, and so the bound can be tested directly.
 *
 * @param expiresAtSeconds - The token's `exp` claim, in seconds since the epoch.
 *   Anything that is not a finite number is reported as `invalid-expiry` rather
 *   than producing a `NaN` delay, which `setTimeout` would run immediately.
 * @param now - Current time in milliseconds; injectable for tests.
 * @returns The renewal delay, or why the token cannot be renewed on a timer.
 */
export function getSessionRefreshSchedule(
  expiresAtSeconds: unknown,
  now: number = Date.now(),
): SessionRefreshSchedule {
  if (typeof expiresAtSeconds !== "number" || !Number.isFinite(expiresAtSeconds)) {
    return { kind: "unusable", reason: "invalid-expiry" };
  }

  const timeLeftMs = expiresAtSeconds * 1000 - now;
  if (timeLeftMs <= 0) {
    return { kind: "unusable", reason: "expired" };
  }

  return {
    kind: "refresh",
    delayMs: Math.max(
      MIN_SESSION_REFRESH_DELAY_MS,
      timeLeftMs - SESSION_REFRESH_LEAD_MS,
    ),
  };
}
