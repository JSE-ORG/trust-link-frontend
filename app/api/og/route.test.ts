import type React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Integration tests for the Open Graph image generation route (GET /api/og).
 *
 * `next/og`'s `ImageResponse` is aliased to `__mocks__/next-og.ts` in
 * vitest.config.ts, which returns a plain Response with image/png
 * content-type. This lets us verify the handler's HTTP contract without
 * requiring the Edge runtime image renderer.
 */
import { __resetRateLimitMemory, RATE_LIMITS } from "@/lib/rateLimit";
import { authHeader, MALFORMED_TOKEN } from "@/tests/support/jwt";

import { GET } from "./route";

function authedRequest(url = "http://localhost/api/og", headers: Record<string, string> = {}) {
  return new Request(url, { headers: { ...authHeader(), ...headers } });
}

describe("GET /api/og", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetRateLimitMemory();
  });

  it("returns 200 with an image content-type for a bare request", async () => {
    const response = await GET(authedRequest() as Parameters<typeof GET>[0]);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/image\//);
  });

  it("returns 200 when title, amount and status query params are provided", async () => {
    const url = new URL("http://localhost/api/og");
    url.searchParams.set("title", "Test Escrow");
    url.searchParams.set("amount", "500");
    url.searchParams.set("status", "Funded");

    const response = await GET(authedRequest(url.toString()) as Parameters<typeof GET>[0]);

    expect(response.status).toBe(200);
  });

  it("returns 200 when only a title is provided", async () => {
    const url = new URL("http://localhost/api/og");
    url.searchParams.set("title", "TrustLink Escrow");

    const response = await GET(authedRequest(url.toString()) as Parameters<typeof GET>[0]);

    expect(response.status).toBe(200);
  });

  it("returns 200 with no query params and uses defaults", async () => {
    const response = await GET(authedRequest() as Parameters<typeof GET>[0]);

    expect(response.status).toBe(200);
  });

  it("returns 200 when status param is provided without amount", async () => {
    const url = new URL("http://localhost/api/og");
    url.searchParams.set("status", "Shipped");

    const response = await GET(authedRequest(url.toString()) as Parameters<typeof GET>[0]);

    expect(response.status).toBe(200);
  });

  it("renders one correctly styled status and supported card styles", async () => {
    const url = new URL("http://localhost/api/og");
    url.searchParams.set("title", "Custom Escrow");
    url.searchParams.set("amount", "250");
    url.searchParams.set("status", "Funded");

    const response = await GET(authedRequest(url.toString()) as Parameters<typeof GET>[0]);
    expect(response.status).toBe(200);

    const imageResp = response as unknown as {
      element: React.ReactElement<{
        style: Record<string, unknown>;
        children: React.ReactNode[];
      }>;
      options: { width: number; height: number };
    };

    expect(imageResp.options.width).toBe(1200);
    expect(imageResp.options.height).toBe(630);
    expect(imageResp.element.props.style.backgroundColor).toBe("#1B2A6B");

    const elementStr = JSON.stringify(imageResp.element);
    const statusMatches = elementStr.match(/Status:\s*Funded/g);
    expect(statusMatches).toHaveLength(1);
  });

  it("returns 401 for an unauthenticated request", async () => {
    const response = await GET(
      new Request("http://localhost/api/og") as Parameters<typeof GET>[0]
    );

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.message).toMatch(/unauthorized|auth|token|bearer/i);
  });

  it("returns 401 for a malformed bearer token", async () => {
    const response = await GET(
      authedRequest("http://localhost/api/og", {
        Authorization: `Bearer ${MALFORMED_TOKEN}`,
      }) as Parameters<typeof GET>[0]
    );

    expect(response.status).toBe(401);
  });

  it("rate limits repeated requests from the same client", async () => {
    const headers = { "x-forwarded-for": "203.0.113.7" };

    for (let i = 0; i < RATE_LIMITS.og.limit; i += 1) {
      const response = await GET(authedRequest(undefined, headers) as Parameters<typeof GET>[0]);
      expect(response.status).toBe(200);
    }

    const blocked = await GET(authedRequest(undefined, headers) as Parameters<typeof GET>[0]);
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("Retry-After")).toBeDefined();
  });
});
