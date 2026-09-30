/**
 * Issue #424 — contextual logging wrapper around Sentry.
 *
 * Bare `Sentry.captureException(error)` calls arrive in Sentry with no idea of
 * *who* hit the error or *what* they were doing. This module is the single entry
 * point for error reporting so every event carries the same baseline context:
 *
 *   - `user.id` — the connected Stellar wallet address, when there is one
 *   - `scope` / `action` tags — which subsystem and operation failed
 *   - `escrow.id` tag — set whenever the failure relates to a specific escrow
 *
 * Call `setLoggerUser()` from the wallet provider on connect/disconnect. Outside
 * React (API helpers, wallet adapters) the wallet address is recovered from
 * localStorage, so server-rendered and pre-hydration errors still get a user.
 */

import * as Sentry from "@sentry/nextjs";

/** Mirrors the key WalletProvider persists the connected address under. */
const PUBLIC_KEY_STORAGE_KEY = "wallet.publicKey";

/** Subsystem the error came from — becomes the `scope` tag in Sentry. */
export type LogScope =
  | "auth"
  | "api"
  | "escrow"
  | "ui"
  | "wallet"
  | "unknown";

export interface LogContext {
  /** Subsystem the failure belongs to. Defaults to `"unknown"`. */
  scope?: LogScope;
  /** Operation that failed, e.g. `"signTransaction"` or `"ErrorBoundary"`. */
  action?: string;
  /** Escrow the failure relates to, when applicable. */
  escrowId?: string;
  /** Additional tags — values must be primitives Sentry can index. */
  tags?: Record<string, string>;
  /** Structured payloads shown on the event, grouped by section name. */
  contexts?: Record<string, Record<string, unknown>>;
  /** Free-form debugging data attached to the event. */
  extra?: Record<string, unknown>;
}

/**
 * Last known wallet address. Kept in module scope so non-React callers do not
 * have to reach for localStorage on every capture.
 */
let currentUserId: string | null = null;

/**
 * Records the connected wallet on both the logger and the Sentry scope.
 * Pass `null` on disconnect to clear the user from subsequent events.
 */
export function setLoggerUser(publicKey: string | null): void {
  currentUserId = publicKey;
  Sentry.setUser(publicKey ? { id: publicKey } : null);
}

/** Tags every subsequent event with the escrow currently being viewed. */
export function setEscrowContext(escrowId: string): void {
  Sentry.setTag("escrow.id", escrowId);
  Sentry.setContext("escrow", { escrowId });
}

/** Resolves the wallet address, falling back to the persisted one. */
function resolveUserId(): string | null {
  if (currentUserId) return currentUserId;
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(PUBLIC_KEY_STORAGE_KEY);
  } catch {
    // Private mode / disabled storage — an anonymous event is still useful.
    return null;
  }
}

/** Anything can be thrown in JS; Sentry groups `Error` instances far better. */
function toError(thrown: unknown): Error {
  if (thrown instanceof Error) return thrown;
  return new Error(typeof thrown === "string" ? thrown : JSON.stringify(thrown));
}

/** Builds the Sentry payload shared by `captureError` and `captureMessage`. */
function buildScopeContext(context: LogContext) {
  const { scope = "unknown", action, escrowId, tags, contexts, extra } = context;
  const userId = resolveUserId();

  return {
    ...(userId ? { user: { id: userId } } : {}),
    tags: {
      scope,
      ...(action ? { action } : {}),
      ...(escrowId ? { "escrow.id": escrowId } : {}),
      ...tags,
    },
    ...(contexts ? { contexts } : {}),
    ...(extra ? { extra } : {}),
  };
}

/**
 * Reports an error to Sentry with the wallet address and operation context
 * attached. Prefer this over calling `Sentry.captureException` directly.
 *
 * @returns the Sentry event id, useful for surfacing a support reference.
 */
export function captureError(thrown: unknown, context: LogContext = {}): string {
  return Sentry.captureException(toError(thrown), buildScopeContext(context));
}

/** Reports a non-exception event (degraded state, unexpected-but-handled path). */
export function captureMessage(
  message: string,
  context: LogContext & { level?: Sentry.SeverityLevel } = {}
): string {
  const { level = "info", ...rest } = context;
  return Sentry.captureMessage(message, {
    level,
    ...buildScopeContext(rest),
  });
}

/**
 * Context keys that carry signed or unsigned transaction XDR. XDR encodes the
 * full transaction — source account, sequence number, memo, and every
 * operation — so it is never sent to Sentry. Only its size is kept, which is
 * enough to correlate a failure with a submission without leaking the payload.
 */
const XDR_CONTEXT_KEYS = new Set([
  "xdr",
  "txXdr",
  "transaction",
  "transactionXdr",
  "unsignedXdr",
  "signedXdr",
  "signedTxXdr",
]);

/** Longest raw string kept verbatim in a redacted context. */
const MAX_CONTEXT_VALUE_LENGTH = 200;

/**
 * Strips transaction XDR (and other oversized strings) from a context payload
 * before it leaves the browser. Values under an XDR key are replaced with a
 * `[redacted:<length>]` marker, which keeps the size of the payload — enough to
 * correlate a failure with a submission — without carrying the transaction.
 */
export function redactTransactionContext(
  transaction: Record<string, unknown>
): Record<string, unknown> {
  const redacted: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(transaction)) {
    if (XDR_CONTEXT_KEYS.has(key) && typeof value === "string") {
      redacted[key] = `[redacted:${value.length}]`;
    } else if (typeof value === "string" && value.length > MAX_CONTEXT_VALUE_LENGTH) {
      redacted[key] = `${value.slice(0, MAX_CONTEXT_VALUE_LENGTH)}…[truncated]`;
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

/**
 * Wallet/transaction failures. The signing payload is attached under its own
 * `transaction` context section so it stays readable in the Sentry UI — with
 * any XDR redacted by `redactTransactionContext` first.
 */
export function captureWalletError(
  error: unknown,
  transaction: Record<string, unknown>
): string {
  const redacted = redactTransactionContext(transaction);

  return captureError(error, {
    scope: "wallet",
    action: typeof redacted.action === "string" ? redacted.action : undefined,
    contexts: { transaction: redacted },
  });
}

/** Adds a breadcrumb so the events leading up to a failure are visible. */
export function addBreadcrumb(
  message: string,
  data?: Record<string, unknown>,
  scope: LogScope = "unknown"
): void {
  Sentry.addBreadcrumb({ category: scope, message, data, level: "info" });
}

export const logger = {
  setUser: setLoggerUser,
  setEscrowContext,
  error: captureError,
  message: captureMessage,
  walletError: captureWalletError,
  redact: redactTransactionContext,
  breadcrumb: addBreadcrumb,
};

export default logger;
