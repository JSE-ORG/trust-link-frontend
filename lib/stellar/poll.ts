/**
 * Backoff + jitter polling for Stellar transaction confirmation.
 *
 * Soroban transactions are submitted asynchronously: `sendTransaction` returns
 * `PENDING` and the result only shows up on a later `getTransaction` call. The
 * previous implementation polled a fixed number of times on a fixed 1s interval
 * and discarded the transaction hash when it gave up, so a caller that hit the
 * timeout had no way to look the transaction up.
 *
 * `pollWithBackoff` fixes both: delays grow geometrically with a random jitter
 * so a busy RPC node is not hammered in lockstep by every client, and the
 * timeout error carries the hash via `onTimeout`.
 */

export interface PollWithBackoffOptions<T> {
  /**
   * Performs one poll. Return the resolved value to stop, or `null`/`undefined`
   * while the work is still pending. Throwing propagates immediately.
   */
  check: () => Promise<T | null | undefined>;
  /** Total budget for polling. Defaults to 60_000ms. */
  timeoutMs?: number;
  /** Delay before the first retry. Defaults to 500ms. */
  initialDelayMs?: number;
  /** Upper bound for a single delay. Defaults to 5_000ms. */
  maxDelayMs?: number;
  /** Geometric growth factor. Defaults to 1.5. */
  factor?: number;
  /** Random share of each delay, in `[0, 1]`. Defaults to 0.2. */
  jitterRatio?: number;
  /** Awaitable sleep, injected by tests. Defaults to `setTimeout`. */
  sleep?: (ms: number) => Promise<void>;
  /** Random source in `[0, 1)`, injected by tests. Defaults to `Math.random`. */
  random?: () => number;
  /** Monotonic-ish clock in ms, injected by tests. Defaults to `Date.now`. */
  now?: () => number;
  /** Builds the error thrown when the budget is exhausted. */
  onTimeout?: (attempts: number) => Error;
}

const DEFAULTS = {
  timeoutMs: 60_000,
  initialDelayMs: 500,
  maxDelayMs: 5_000,
  factor: 1.5,
  jitterRatio: 0.2,
} as const;

function defaultSleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Delay to wait before retry number `attempt` (1-based), capped at
 * `maxDelayMs` and spread by up to ±`jitterRatio` so concurrent clients do not
 * retry in lockstep.
 */
export function computeBackoffDelay(
  attempt: number,
  options: {
    initialDelayMs?: number;
    maxDelayMs?: number;
    factor?: number;
    jitterRatio?: number;
    random?: () => number;
  } = {}
): number {
  const {
    initialDelayMs = DEFAULTS.initialDelayMs,
    maxDelayMs = DEFAULTS.maxDelayMs,
    factor = DEFAULTS.factor,
    jitterRatio = DEFAULTS.jitterRatio,
    random = Math.random,
  } = options;

  const exponential = initialDelayMs * Math.pow(factor, Math.max(0, attempt - 1));
  const capped = Math.min(exponential, maxDelayMs);
  const spread = capped * jitterRatio * (random() * 2 - 1);

  return Math.max(0, Math.round(capped + spread));
}

/** Thrown when polling runs out of budget. Carries the attempt count. */
export class PollTimeoutError extends Error {
  readonly attempts: number;
  readonly timeoutMs: number;

  constructor(attempts: number, timeoutMs: number) {
    super(`Timed out after ${attempts} attempt(s) over ${timeoutMs}ms`);
    this.name = "PollTimeoutError";
    this.attempts = attempts;
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Repeatedly calls `check` until it yields a value or the budget is exhausted.
 *
 * @returns the first non-nullish value returned by `check`.
 * @throws whatever `check` throws, or `onTimeout(attempts)` on timeout.
 */
export async function pollWithBackoff<T>(
  options: PollWithBackoffOptions<T>
): Promise<T> {
  const {
    check,
    timeoutMs = DEFAULTS.timeoutMs,
    sleep = defaultSleep,
    random = Math.random,
    now = Date.now,
    onTimeout,
  } = options;

  const startedAt = now();
  let attempts = 0;

  for (;;) {
    attempts += 1;

    const value = await check();
    if (value !== null && value !== undefined) {
      return value;
    }

    const elapsed = now() - startedAt;
    if (elapsed >= timeoutMs) {
      throw onTimeout ? onTimeout(attempts) : new PollTimeoutError(attempts, timeoutMs);
    }

    await sleep(computeBackoffDelay(attempts, { ...options, random }));
  }
}
