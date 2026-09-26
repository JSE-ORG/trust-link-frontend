import { afterEach, beforeEach,describe, expect, it, vi } from "vitest";

import {
  __resetRateLimitMemory,
  checkRateLimit,
  enforceRateLimit,
  getClientId,
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
