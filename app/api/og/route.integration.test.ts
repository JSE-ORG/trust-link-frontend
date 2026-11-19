import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { __resetRateLimitMemory } from "@/lib/rateLimit";
import { MALFORMED_TOKEN, VALID_JWT } from "@/tests/support/jwt";

import { GET } from "./route";

// Mock next/og ImageResponse for test environment if WASM resvg engine is uninitialized
vi.mock("next/og", () => {
  return {
    ImageResponse: class MockImageResponse extends Response {
      constructor(
        _element: unknown,
        options?: { width?: number; height?: number; headers?: Record<string, string> }
      ) {
        super("OG Image Content", {
          status: 200,
          headers: { "Content-Type": "image/png", ...(options?.headers ?? {}) },
        });
      }
    },
  };
});

function authed(url: string, token: string = VALID_JWT): NextRequest {
  return new NextRequest(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
}

describe("GET /api/og Integration Tests", () => {
  beforeEach(() => {
    __resetRateLimitMemory();
  });

  it("generates OG image with default title when no query parameters are passed", async () => {
    const request = authed("http://localhost:3000/api/og");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
  });

  it("generates OG image with custom title, amount, and status parameters", async () => {
    const url = "http://localhost:3000/api/og?title=Custom%20Escrow&amount=500&status=SHIPPED";
    const request = authed(url);
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
  });

  it("bounds oversized parameters safely before image generation", async () => {
    const oversizedTitle = encodeURIComponent("X".repeat(500));
    const oversizedAmount = encodeURIComponent("9".repeat(100));
    const oversizedStatus = encodeURIComponent("PENDING".repeat(20));
    const url = `http://localhost:3000/api/og?title=${oversizedTitle}&amount=${oversizedAmount}&status=${oversizedStatus}`;
    const request = authed(url);
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
  });

  it("returns 401 when no bearer token is supplied", async () => {
    const request = new NextRequest("http://localhost:3000/api/og");
    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  it("returns 401 when the bearer token is malformed", async () => {
    const request = authed("http://localhost:3000/api/og", MALFORMED_TOKEN);
    const response = await GET(request);

    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.message).toMatch(/unauthorized|auth|token|bearer/i);
  });

  it("returns 500 status code when an exception occurs", async () => {
    const invalidRequest = {
      headers: new Headers({ Authorization: `Bearer ${VALID_JWT}` }),
      get url() {
        throw new Error("Invalid request URL");
      },
    } as unknown as NextRequest;

    const response = await GET(invalidRequest);

    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).toBe("Failed to generate OG image");
  });

  it("rate limits repeated requests from the same client", async () => {
    const headers = { Authorization: `Bearer ${VALID_JWT}`, "x-forwarded-for": "198.51.100.9" };
    for (let i = 0; i < 20; i += 1) {
      const response = await GET(new NextRequest("http://localhost:3000/api/og", { headers }));
      expect(response.status).toBe(200);
    }
    const blocked = await GET(new NextRequest("http://localhost:3000/api/og", { headers }));
    expect(blocked.status).toBe(429);
  });
});
