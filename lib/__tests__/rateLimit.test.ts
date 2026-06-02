import { describe, it, expect, beforeEach } from "vitest";
import {
  checkRateLimit,
  enforceRateLimit,
  getClientId,
  __resetRateLimitMemory,
} from "@/lib/rateLimit";

// These tests exercise the in-memory fallback (no UPSTASH_* env configured),
// which is the path used in dev/CI. Issue #112: excessive requests are blocked.

beforeEach(() => {
  __resetRateLimitMemory();
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
});
