import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  __getRateLimitMemorySize,
  __resetRateLimitMemory,
  __setMaxMemoryEntries,
  checkRateLimit,
  enforceRateLimit,
  getClientId,
  getRateLimitKey,
  isValidIp,
  MAX_MEMORY_ENTRIES,
  pruneExpiredEntries,
  RATE_LIMITS,
} from "@/lib/rateLimit";

// These tests exercise the in-memory fallback (no UPSTASH_* env configured),
// which is the path used in dev/CI. Issue #112: excessive requests are blocked.

beforeEach(() => {
  __resetRateLimitMemory();
});

afterEach(() => {
  vi.useRealTimers();
});

function req(ip = "1.2.3.4"): Request {
  return new Request("https://example.test/api", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("getClientId", () => {
  it("reads the first x-forwarded-for entry", () => {
    const r = new Request("https://x.test", {
      headers: { "x-forwarded-for": "9.9.9.9, 10.0.0.1" },
    });
    expect(getClientId(r)).toBe("9.9.9.9");
  });

  it("falls back to x-real-ip then 'anonymous'", () => {
    expect(
      getClientId(new Request("https://x.test", { headers: { "x-real-ip": "8.8.8.8" } })),
    ).toBe("8.8.8.8");
    expect(getClientId(new Request("https://x.test"))).toBe("anonymous");
  });

  it("returns 'anonymous' when request has no headers", () => {
    expect(getClientId(new Request("https://x.test"))).toBe("anonymous");
  });

  it("handles x-forwarded-for with leading/trailing whitespace", () => {
    const r = new Request("https://x.test", {
      headers: { "x-forwarded-for": "  5.5.5.5 , 6.6.6.6" },
    });
    expect(getClientId(r)).toBe("5.5.5.5");
  });

  it("handles single IP in x-forwarded-for", () => {
    const r = new Request("https://x.test", {
      headers: { "x-forwarded-for": "1.1.1.1" },
    });
    expect(getClientId(r)).toBe("1.1.1.1");
  });

  it("ignores spoofed, non-IP x-forwarded-for values", () => {
    const r = new Request("https://x.test", {
      headers: { "x-forwarded-for": "not-an-ip, also-bad" },
    });
    expect(getClientId(r)).toBe("anonymous");
  });

  it("skips junk entries and uses the first valid IP", () => {
    const r = new Request("https://x.test", {
      headers: { "x-forwarded-for": "spoofed, 9.9.9.9, 10.0.0.1" },
    });
    expect(getClientId(r)).toBe("9.9.9.9");
  });

  it("prefers platform-set headers over client-controllable x-forwarded-for", () => {
    const r = new Request("https://x.test", {
      headers: {
        "x-forwarded-for": "1.2.3.4",
        "x-real-ip": "5.6.7.8",
      },
    });
    expect(getClientId(r)).toBe("5.6.7.8");
  });

  it("accepts IPv6 values", () => {
    const r = new Request("https://x.test", {
      headers: { "x-forwarded-for": "2001:db8::1" },
    });
    expect(getClientId(r)).toBe("2001:db8::1");
  });

  it("rejects malformed IPs", () => {
    expect(isValidIp("999.999.999.999")).toBe(false);
    expect(isValidIp("256.0.0.1")).toBe(false);
    expect(isValidIp("01.2.3.4")).toBe(false);
    expect(isValidIp("not-an-ip")).toBe(false);
    expect(isValidIp("1.2.3.4")).toBe(true);
  });
});

describe("getRateLimitKey", () => {
  it("uses a stable ip: bucket for identified clients", () => {
    const r = new Request("https://x.test", {
      headers: { "x-forwarded-for": "1.2.3.4" },
    });
    expect(getRateLimitKey(r)).toBe("default:ip:1.2.3.4");
    expect(getRateLimitKey(r)).toBe(getRateLimitKey(r));
    expect(getRateLimitKey(r, "escrow:create")).toBe("escrow:create:ip:1.2.3.4");
  });

  it("isolates unidentifiable callers instead of sharing one anonymous bucket", () => {
    const a = getRateLimitKey(new Request("https://x.test"));
    const b = getRateLimitKey(new Request("https://x.test"));
    expect(a.startsWith("default:anonymous:")).toBe(true);
    expect(b.startsWith("default:anonymous:")).toBe(true);
    expect(a).not.toBe(b);
  });
});

describe("RATE_LIMITS", () => {
  it("declares distinct quotas per route class", () => {
    expect(RATE_LIMITS.escrowRead).not.toEqual(RATE_LIMITS.escrowWrite);
    expect(RATE_LIMITS.og.windowMs).not.toBe(RATE_LIMITS.escrowRead.windowMs);
    expect(RATE_LIMITS.og.limit).toBeGreaterThan(0);
    expect(RATE_LIMITS.escrowWrite.limit).toBeGreaterThan(0);
  });
});

describe("checkRateLimit (in-memory fallback)", () => {
  it("allows requests up to the limit then blocks", async () => {
    const limit = 3;
    const window = 10_000;
    const results = [];
    for (let i = 0; i < 4; i++) {
      results.push(await checkRateLimit("ip-a", limit, window));
    }
    expect(results.map((r) => r.success)).toEqual([true, true, true, false]);
    expect(results[0].remaining).toBe(2);
    expect(results[3].remaining).toBe(0);
  });

  it("tracks separate identifiers independently", async () => {
    await checkRateLimit("ip-x", 1, 10_000);
    const second = await checkRateLimit("ip-x", 1, 10_000);
    expect(second.success).toBe(false);

    const other = await checkRateLimit("ip-y", 1, 10_000);
    expect(other.success).toBe(true);
  });

  it("separates operation buckets while sharing requests within an operation", async () => {
    const request = req("10.10.10.10");
    expect(await enforceRateLimit(request, 1, 10_000, "og:image")).toBeNull();
    expect(await enforceRateLimit(request, 1, 10_000, "escrow:create")).toBeNull();
    expect(await enforceRateLimit(request, 1, 10_000, "og:image")).not.toBeNull();
  });

  it("separates memory buckets by requested policy", async () => {
    expect(await checkRateLimit("same-operation", 1, 10_000)).toMatchObject({
      success: true,
      limit: 1,
    });
    expect(await checkRateLimit("same-operation", 2, 10_000)).toMatchObject({
      success: true,
      limit: 2,
      remaining: 1,
    });
  });

  it("resets after the window elapses", async () => {
    const first = await checkRateLimit("ip-z", 1, 20); // 20ms window
    expect(first.success).toBe(true);
    expect((await checkRateLimit("ip-z", 1, 20)).success).toBe(false);

    await new Promise((r) => setTimeout(r, 30));
    expect((await checkRateLimit("ip-z", 1, 20)).success).toBe(true);
  });

  it("returns correct limit and remaining values", async () => {
    const limit = 5;
    const result = await checkRateLimit("ip-limit", limit, 10_000);
    expect(result.limit).toBe(limit);
    expect(result.remaining).toBe(limit - 1);
  });

  it("remaining reaches zero at exact limit", async () => {
    const limit = 2;
    for (let i = 0; i < limit; i++) {
      const r = await checkRateLimit("ip-exact", limit, 10_000);
      expect(r.success).toBe(true);
    }
    const overLimit = await checkRateLimit("ip-exact", limit, 10_000);
    expect(overLimit.success).toBe(false);
    expect(overLimit.remaining).toBe(0);
  });

  it("handles limit of 1 (single request allowed)", async () => {
    const first = await checkRateLimit("ip-one", 1, 10_000);
    expect(first.success).toBe(true);
    expect(first.remaining).toBe(0);

    const second = await checkRateLimit("ip-one", 1, 10_000);
    expect(second.success).toBe(false);
  });

  it("uses default limit and window when not specified", async () => {
    const result = await checkRateLimit("ip-default");
    expect(result.success).toBe(true);
    // Default limit is 20
    expect(result.limit).toBe(20);
  });

  it("returns a reset timestamp in the future", async () => {
    const before = Date.now();
    const result = await checkRateLimit("ip-reset", 10, 10_000);
    expect(result.reset).toBeGreaterThan(before);
    expect(result.reset).toBeLessThanOrEqual(before + 10_000 + 100); // small tolerance
  });

  it("resets individual identifier window independently", async () => {
    await checkRateLimit("ip-solo", 1, 20);
    expect((await checkRateLimit("ip-solo", 1, 20)).success).toBe(false);

    // Other identifiers are unaffected
    const other = await checkRateLimit("ip-other", 1, 10_000);
    expect(other.success).toBe(true);
  });
});

describe("enforceRateLimit", () => {
  it("returns null while under quota", async () => {
    const res = await enforceRateLimit(req("2.2.2.2"), 2, 10_000);
    expect(res).toBeNull();
  });

  it("returns a 429 Response with Retry-After once over quota", async () => {
    const ip = "3.3.3.3";
    await enforceRateLimit(req(ip), 1, 10_000); // consume the single allowance
    const blocked = await enforceRateLimit(req(ip), 1, 10_000);

    expect(blocked).not.toBeNull();
    expect(blocked!.status).toBe(429);
    expect(blocked!.headers.get("Retry-After")).toBeTruthy();
    expect(blocked!.headers.get("RateLimit-Limit")).toBe("1");
    expect(blocked!.headers.get("RateLimit-Remaining")).toBe("0");
    const body = await blocked!.json();
    expect(body.message).toMatch(/too many requests/i);
  });

  it("returns 429 body with correct Content-Type", async () => {
    const ip = "4.4.4.4";
    await enforceRateLimit(req(ip), 1, 10_000);
    const blocked = await enforceRateLimit(req(ip), 1, 10_000);

    expect(blocked!.headers.get("Content-Type")).toBe("application/json");
  });

  it("includes RateLimit-Reset header in 429 response", async () => {
    const ip = "5.5.5.5";
    await enforceRateLimit(req(ip), 1, 10_000);
    const blocked = await enforceRateLimit(req(ip), 1, 10_000);

    const resetHeader = blocked!.headers.get("RateLimit-Reset");
    expect(resetHeader).toBeTruthy();
    expect(Number(resetHeader)).toBeGreaterThan(0);
  });

  it("allows different IPs independently", async () => {
    // IP A uses up its quota
    await enforceRateLimit(req("6.6.6.6"), 1, 10_000);
    const blocked = await enforceRateLimit(req("6.6.6.6"), 1, 10_000);
    expect(blocked).not.toBeNull();

    // IP B is unaffected
    const ok = await enforceRateLimit(req("7.7.7.7"), 1, 10_000);
    expect(ok).toBeNull();
  });

  it("returns null on first request with limit of 1", async () => {
    const res = await enforceRateLimit(req("8.8.8.8"), 1, 10_000);
    expect(res).toBeNull();
  });

  it("uses default limit when not specified", async () => {
    // Default limit is 20, so first request should pass
    const res = await enforceRateLimit(req("9.9.9.9"));
    expect(res).toBeNull();
  });
});

describe("bounded in-memory rate-limit fallback map", () => {
  it("removes expired one-time identifiers without requiring identical key access", async () => {
    vi.useFakeTimers();
    const count = 2_000;
    for (let i = 0; i < count; i++) {
      await checkRateLimit(`one-time-${i}`, 5, 10_000);
    }
    expect(__getRateLimitMemorySize()).toBe(count);

    // Advance time past the 10-second window
    vi.advanceTimersByTime(11_000);

    // A subsequent request for a different key triggers opportunistic bounded cleanup
    const result = await checkRateLimit("new-key", 5, 10_000);
    expect(result.success).toBe(true);

    // All expired one-time keys are removed; only the new key remains
    expect(__getRateLimitMemorySize()).toBe(1);
  });

  it("cleanup does not reset valid active quotas", async () => {
    vi.useFakeTimers();
    // Insert 500 one-time keys with a 5s window
    for (let i = 0; i < 500; i++) {
      await checkRateLimit(`short-lived-${i}`, 1, 5_000);
    }

    // Insert an active client with limit 4 and a longer 20s window
    const first = await checkRateLimit("active-user", 4, 20_000);
    expect(first.success).toBe(true);
    expect(first.remaining).toBe(3);

    const second = await checkRateLimit("active-user", 4, 20_000);
    expect(second.success).toBe(true);
    expect(second.remaining).toBe(2);

    // Advance 6 seconds: the one-time keys expire, but active-user is still within its 20s window
    vi.advanceTimersByTime(6_000);

    // Trigger cleanup via a separate request
    await checkRateLimit("unrelated-key", 10, 10_000);

    // Verify active-user quota was preserved and not reset
    const third = await checkRateLimit("active-user", 4, 20_000);
    expect(third.success).toBe(true);
    expect(third.remaining).toBe(1);

    const fourth = await checkRateLimit("active-user", 4, 20_000);
    expect(fourth.success).toBe(true);
    expect(fourth.remaining).toBe(0);

    // 5th request breaches quota
    const fifth = await checkRateLimit("active-user", 4, 20_000);
    expect(fifth.success).toBe(false);
    expect(fifth.remaining).toBe(0);
  });

  it("bounds memory behavior under large unique-key sequences", async () => {
    vi.useFakeTimers();
    __setMaxMemoryEntries(150);

    // Send 300 unique keys within the same active window
    for (let i = 0; i < 300; i++) {
      await checkRateLimit(`flood-${i}`, 10, 60_000);
    }

    // Map size must never exceed the configured ceiling
    expect(__getRateLimitMemorySize()).toBeLessThanOrEqual(150);
  });

  it("preserves active keys over stale keys during capacity eviction (LRU policy)", async () => {
    vi.useFakeTimers();
    __setMaxMemoryEntries(20);

    // Initialise active client
    await checkRateLimit("frequent-client", 5, 60_000);

    // Flood with unique one-time keys, periodically refreshing frequent-client
    for (let i = 0; i < 40; i++) {
      await checkRateLimit(`transient-${i}`, 10, 60_000);
      if (i === 20) {
        // Refresh frequent client position
        await checkRateLimit("frequent-client", 5, 60_000);
      }
    }

    // Frequent client should still be present with updated count (not evicted and not reset)
    const res = await checkRateLimit("frequent-client", 5, 60_000);
    expect(res.success).toBe(true);
    // Count should be 3 (first + refresh + current), so remaining is 5 - 3 = 2
    expect(res.remaining).toBe(2);
  });

  it("pruneExpiredEntries directly prunes expired keys with bounded work", () => {
    vi.useFakeTimers();
    const now = Date.now();

    // Populate keys directly via checkRateLimit
    for (let i = 0; i < 50; i++) {
      void checkRateLimit(`prune-test-${i}`, 1, 5_000);
    }
    expect(__getRateLimitMemorySize()).toBe(50);

    // Before expiry, pruning removes 0
    expect(pruneExpiredEntries(now)).toBe(0);

    // After expiry, pruning removes all 50
    const pruned = pruneExpiredEntries(now + 6_000);
    expect(pruned).toBe(50);
    expect(__getRateLimitMemorySize()).toBe(0);
  });
});
