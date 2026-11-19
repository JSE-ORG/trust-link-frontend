/**
 * Issue #112 / #882 — rate limiting for API routes.
 *
 * Uses @upstash/ratelimit (sliding window) when Upstash Redis is configured via
 * env (UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN). When it is not — local
 * dev, CI, tests — it falls back to an in-memory limiter so routes are still
 * protected and the code path is exercisable without external infrastructure.
 *
 * ## Failure policy
 *
 * If Redis is configured but unreachable we do NOT silently downgrade to the
 * per-process map forever. Instead:
 *   - a `rate_limit_redis_failure` metric is emitted (Sentry), and
 *   - by default the request is allowed through (fail-open) and served by the
 *     in-memory limiter, so a Redis outage does not take the whole site down.
 *
 * Set `RATE_LIMIT_FAIL_CLOSED=true` to reject requests instead (fail-closed).
 */
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { captureError, captureMessage } from "@/lib/logger";

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Epoch ms when the current window resets. */
  reset: number;
}

/** Fallback quota used when a route does not declare its own. */
export const DEFAULT_LIMIT = 20;
export const DEFAULT_WINDOW_MS = 10_000; // 10s

/**
 * Per-route quotas. Read-only and expensive (mutating / image-rendering) routes
 * should not share a single bucket: a cheap GET must not be able to exhaust the
 * budget of a route that costs real CPU.
 */
export const RATE_LIMITS = {
  /** GET /escrow — cheap list read. */
  escrowRead: { limit: 20, windowMs: 10_000 },
  /** POST /escrow + PATCH /escrow/:id/ship — writes against the backend. */
  escrowWrite: { limit: 15, windowMs: 10_000 },
  /** GET /api/og — ImageResponse rasterisation is CPU-bound. */
  og: { limit: 20, windowMs: 60_000 },
} as const;

// ── In-memory fallback (per-process; fine for dev/CI/single instance) ─────────

/**
 * Maximum entries retained in the in-memory fallback map to bound process memory.
 * Defines a safe ceiling preventing unbounded memory accumulation from one-time keys.
 */
export const MAX_MEMORY_ENTRIES = 10_000;

let currentMaxMemoryEntries = MAX_MEMORY_ENTRIES;

const memoryHits = new Map<string, { count: number; reset: number }>();

/**
 * Prunes expired entries from the in-memory rate-limit map.
 * Operates with bounded work: scans starting from oldest entries in insertion/LRU
 * order and deletes expired windows until active entries are reached or maxBatch is hit.
 *
 * @param now Current timestamp in milliseconds (defaults to Date.now()).
 * @param maxBatch Maximum number of expired entries to prune in one call.
 * @returns Number of entries pruned.
 */
export function pruneExpiredEntries(
  now: number = Date.now(),
  maxBatch: number = currentMaxMemoryEntries
): number {
  let pruned = 0;
  for (const [key, entry] of memoryHits) {
    if (entry.reset <= now) {
      memoryHits.delete(key);
      pruned += 1;
      if (pruned >= maxBatch) break;
    } else {
      // Since entries are generally ordered by expiration/usage, stop early
      // when encountering valid active windows, bounding scan work.
      break;
    }
  }
  return pruned;
}

/**
 * Enforces the bounded map ceiling by evicting expired entries first, and
 * falling back to LRU eviction of the oldest entries if capacity is still exceeded.
 */
function enforceMemoryBounds(now: number): void {
  if (memoryHits.size < currentMaxMemoryEntries) return;

  // First pass: prune expired entries across the map
  for (const [key, entry] of memoryHits) {
    if (entry.reset <= now) {
      memoryHits.delete(key);
    }
  }

  // Second pass: if still at or over ceiling, evict oldest entries (FIFO / LRU)
  while (memoryHits.size >= currentMaxMemoryEntries) {
    const oldestKey = memoryHits.keys().next().value;
    if (oldestKey === undefined) break;
    memoryHits.delete(oldestKey);
  }
}

function memoryLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();

  // Opportunistic bounded cleanup: prune expired entries at the head of the map
  pruneExpiredEntries(now);

  const entry = memoryHits.get(key);

  if (!entry || entry.reset <= now) {
    if (entry) {
      memoryHits.delete(key);
    }
    enforceMemoryBounds(now);
    const reset = now + windowMs;
    memoryHits.set(key, { count: 1, reset });
    return { success: true, limit, remaining: limit - 1, reset };
  }

  // Active entry hit: refresh position to the back of the Map (MRU order)
  // so frequently active clients are preserved during capacity eviction
  memoryHits.delete(key);
  entry.count += 1;
  memoryHits.set(key, entry);

  const remaining = Math.max(0, limit - entry.count);
  return {
    success: entry.count <= limit,
    limit,
    remaining,
    reset: entry.reset,
  };
}

/** Returns the current number of entries in the in-memory fallback map. */
export function __getRateLimitMemorySize(): number {
  return memoryHits.size;
}

/** Test-only: overrides the maximum allowed entries in memoryHits. */
export function __setMaxMemoryEntries(max: number): void {
  currentMaxMemoryEntries = max;
}

/** Test-only: clears the in-memory window state and resets capacity limits. */
export function __resetRateLimitMemory(): void {
  memoryHits.clear();
  currentMaxMemoryEntries = MAX_MEMORY_ENTRIES;
}

// ── Upstash-backed limiter (lazy, only when configured) ───────────────────────

const upstashLimiters = new Map<string, Ratelimit>();

function getUpstashLimiter(limit: number, windowMs: number): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const policyKey = `${limit}:${windowMs}`;
  const existing = upstashLimiters.get(policyKey);
  if (existing) return existing;

  const limiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
    prefix: "trustlink-ratelimit",
    analytics: false,
  });
  upstashLimiters.set(policyKey, limiter);
  return limiter;
}

/** Test-only: drops the memoised Upstash limiter. */
export function __resetUpstashLimiter(): void {
  upstashLimiters.clear();
}

/**
 * Check whether `identifier` (typically the client IP) is within its rate quota.
 * Uses Upstash when configured, otherwise the in-memory fallback.
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = DEFAULT_LIMIT,
  windowMs: number = DEFAULT_WINDOW_MS
): Promise<RateLimitResult> {
  const policyKey = `${limit}:${windowMs}:${identifier}`;
  try {
    const limiter = getUpstashLimiter(limit, windowMs);
    if (limiter) {
      const res = await limiter.limit(policyKey);
      return {
        success: res.success,
        limit,
        remaining: res.remaining,
        reset: res.reset,
      };
    }
  } catch (error) {
    // Report the outage as a first-class metric rather than a bare console line.
    captureError(error, {
      scope: "api",
      action: "rateLimitRedisFailure",
      extra: { identifier, limit, windowMs },
    });
    captureMessage("rate_limit_redis_failure", {
      scope: "api",
      level: "warning",
      tags: { metric: "rate_limit_redis_failure" },
      extra: { identifier, limit, windowMs },
    });

    if (process.env.RATE_LIMIT_FAIL_CLOSED === "true") {
      // Fail closed: deny the request until Redis is reachable again.
      return { success: false, limit, remaining: 0, reset: Date.now() + windowMs };
    }

    // Fail open (documented default): serve the request from the per-process
    // limiter. We intentionally keep `upstashLimiter` memoised so the next
    // request retries Redis instead of permanently downgrading.
    console.warn("Rate limiter Redis failure, falling back to in-memory");
  }

  return memoryLimit(policyKey, limit, windowMs);
}

// ── Client identification ─────────────────────────────────────────────────────

const IPV4_RE = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
const IPV6_RE = /^[0-9a-fA-F:]+$/;

function isValidIpv4(value: string): boolean {
  const match = IPV4_RE.exec(value);
  if (!match) return false;
  return match.slice(1).every((octet) => {
    if (octet.length > 1 && octet.startsWith("0")) return false; // no leading zeros
    const n = Number(octet);
    return n >= 0 && n <= 255;
  });
}

function isValidIpv6(value: string): boolean {
  if (!value.includes(":") || !IPV6_RE.test(value)) return false;
  // At most one `::` compression is allowed.
  return value.split("::").length <= 2;
}

/** True for syntactically valid IPv4 or IPv6 addresses. */
export function isValidIp(value: string): boolean {
  return isValidIpv4(value) || isValidIpv6(value);
}

/** Returns the first syntactically valid IP in a comma-separated header. */
function firstValidIp(header: string | null | undefined): string | null {
  if (!header) return null;
  for (const part of header.split(",")) {
    const candidate = part.trim();
    if (candidate && isValidIp(candidate)) return candidate;
  }
  return null;
}

/**
 * Derive a client identifier from a request's headers.
 *
 * Only syntactically valid IPs are accepted, and proxy headers that the platform
 * sets (`x-real-ip`, `cf-connecting-ip`) are preferred over the client-
 * controllable `x-forwarded-for`. Invalid values are ignored rather than turned
 * into arbitrary bucket keys.
 */
export function getClientId(request: Request | null | undefined): string {
  const headers = request?.headers;
  if (!headers) return "anonymous";

  return (
    firstValidIp(headers.get("x-real-ip")) ??
    firstValidIp(headers.get("cf-connecting-ip")) ??
    firstValidIp(headers.get("x-forwarded-for")) ??
    "anonymous"
  );
}

function randomId(): string {
  const cryptoObj = globalThis.crypto as Crypto | undefined;
  if (cryptoObj && typeof cryptoObj.randomUUID === "function") {
    return cryptoObj.randomUUID();
  }
  return Math.random().toString(36).slice(2);
}

/**
 * Build the rate-limit bucket key for a request.
 *
 * Identified clients share a stable `ip:<addr>` bucket. Callers we cannot
 * identify (no valid IP header) get a unique bucket instead of a shared
 * `anonymous` one, so a single headerless client cannot exhaust a quota that
 * every other anonymous caller also draws from.
 */
export function getRateLimitKey(
  request: Request | null | undefined,
  operation = "default"
): string {
  const id = getClientId(request);
  return id === "anonymous"
    ? `${operation}:anonymous:${randomId()}`
    : `${operation}:ip:${id}`;
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
  operation = "default"
): Promise<Response | null> {
  const id = getRateLimitKey(request, operation);
  const result = await checkRateLimit(id, limit, windowMs);

  if (!result.success) {
    console.warn("Rate limit exceeded for " + id, { limit, windowMs });
    const retryAfterSec = Math.max(
      1,
      Math.ceil((result.reset - Date.now()) / 1000)
    );
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
      }
    );
  }

  return null;
}
