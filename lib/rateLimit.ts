/**
 * Issue #112 — rate limiting for API routes.
 *
 * Uses @upstash/ratelimit (sliding window) when Upstash Redis is configured via
 * env (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN). When it is not — local
 * dev, CI, tests — it falls back to an in-memory limiter so routes are still
 * protected and the code path is exercisable without external infrastructure.
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Epoch ms when the current window resets. */
  reset: number;
}

/** Requests allowed per window, and the window length in milliseconds. */
const DEFAULT_LIMIT = 20;
const DEFAULT_WINDOW_MS = 10_000; // 10s

// ── In-memory fallback (per-process; fine for dev/CI/single instance) ─────────

const memoryHits = new Map<string, { count: number; reset: number }>();

function memoryLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  const entry = memoryHits.get(key);

  if (!entry || entry.reset <= now) {
    const reset = now + windowMs;
    memoryHits.set(key, { count: 1, reset });
    return { success: true, limit, remaining: limit - 1, reset };
  }

  entry.count += 1;
  const remaining = Math.max(0, limit - entry.count);
  return {
    success: entry.count <= limit,
    limit,
    remaining,
    reset: entry.reset,
  };
}

/** Test-only: clears the in-memory window state. */
export function __resetRateLimitMemory(): void {
  memoryHits.clear();
}

// ── Upstash-backed limiter (lazy, only when configured) ───────────────────────

let upstashLimiter: Ratelimit | null = null;

function getUpstashLimiter(): Ratelimit | null {
  if (upstashLimiter) return upstashLimiter;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  upstashLimiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(DEFAULT_LIMIT, `${DEFAULT_WINDOW_MS} ms`),
    prefix: "trustlink-ratelimit",
    analytics: false,
  });
  return upstashLimiter;
}

/**
 * Check whether `identifier` (typically the client IP) is within its rate quota.
 * Uses Upstash when configured, otherwise the in-memory fallback.
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = DEFAULT_LIMIT,
  windowMs: number = DEFAULT_WINDOW_MS,
): Promise<RateLimitResult> {
  const limiter = getUpstashLimiter();
  if (limiter) {
    const res = await limiter.limit(identifier);
    return {
      success: res.success,
      limit: res.limit,
      remaining: res.remaining,
      reset: res.reset,
    };
  }
  return memoryLimit(identifier, limit, windowMs);
}

/** Derive a stable client identifier from a request's forwarded headers. */
export function getClientId(request: Request): string {
  // Defensive: in some call sites (e.g. unit tests invoking a handler directly)
  // a Request may not be supplied. Treat that as the anonymous bucket.
  const headers = request?.headers;
  if (!headers) return "anonymous";
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return headers.get("x-real-ip") ?? "anonymous";
}

/**
 * Convenience wrapper for route handlers: returns a 429 `Response` when the
 * caller is over quota, or `null` when the request may proceed. Adds the
 * standard `RateLimit-*` and `Retry-After` headers either way.
 */
export async function enforceRateLimit(
  request: Request,
  limit: number = DEFAULT_LIMIT,
  windowMs: number = DEFAULT_WINDOW_MS,
): Promise<Response | null> {
  const id = getClientId(request);
  const result = await checkRateLimit(id, limit, windowMs);

  if (!result.success) {
    const retryAfterSec = Math.max(1, Math.ceil((result.reset - Date.now()) / 1000));
    return new Response(
      JSON.stringify({ message: "Too many requests. Please slow down." }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "RateLimit-Limit": String(result.limit),
          "RateLimit-Remaining": String(result.remaining),
          "RateLimit-Reset": String(Math.ceil(result.reset / 1000)),
          "Retry-After": String(retryAfterSec),
        },
      },
    );
  }

  return null;
}
