import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

import { GET } from "./route";

// Mock next/og ImageResponse for test environment if WASM resvg engine is uninitialized
vi.mock("next/og", () => {
  return {
    ImageResponse: class MockImageResponse extends Response {
      constructor(element: React.ReactNode, options?: ResponseInit & { width?: number; height?: number }) {
        super("OG Image Content", {
          status: 200,
          headers: { "Content-Type": "image/png" },
          ...options,
        });
      }
    },
  };
});

describe("GET /api/og Integration Tests", () => {
  it("generates OG image with default title when no query parameters are passed", async () => {
    const request = new NextRequest("http://localhost:3000/api/og");
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
  });

  it("generates OG image with custom title, amount, and status parameters", async () => {
    const url = "http://localhost:3000/api/og?title=Custom%20Escrow&amount=500&status=SHIPPED";
    const request = new NextRequest(url);
    const response = await GET(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toBe("image/png");
  });

  it("returns 500 status code when an exception occurs", async () => {
    const invalidRequest = {
      get url() {
        throw new Error("Invalid request URL");
      },
    } as unknown as NextRequest;

    const response = await GET(invalidRequest);

    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).toBe("Failed to generate OG image");
  });
});
