import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Integration tests for the Open Graph image generation route (GET /api/og).
 *
 * `next/og`'s `ImageResponse` is aliased to `__mocks__/next-og.ts` in
 * vitest.config.ts, which returns a plain Response with image/png
 * content-type. This lets us verify the handler's HTTP contract without
 * requiring the Edge runtime image renderer.
 */
import { GET } from "./route";

describe("GET /api/og", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 200 with an image content-type for a bare request", async () => {
    const request = new Request("http://localhost/api/og");
    const response = await GET(request as Parameters<typeof GET>[0]);

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toMatch(/image\//);
  });

  it("returns 200 when title, amount and status query params are provided", async () => {
    const url = new URL("http://localhost/api/og");
    url.searchParams.set("title", "Test Escrow");
    url.searchParams.set("amount", "500");
    url.searchParams.set("status", "Funded");

    const request = new Request(url.toString());
    const response = await GET(request as Parameters<typeof GET>[0]);

    expect(response.status).toBe(200);
  });

  it("returns 200 when only a title is provided", async () => {
    const url = new URL("http://localhost/api/og");
    url.searchParams.set("title", "TrustLink Escrow");

    const request = new Request(url.toString());
    const response = await GET(request as Parameters<typeof GET>[0]);

    expect(response.status).toBe(200);
  });

  it("returns 200 with no query params and uses defaults", async () => {
    const request = new Request("http://localhost/api/og");
    const response = await GET(request as Parameters<typeof GET>[0]);

    expect(response.status).toBe(200);
  });

  it("returns 200 when status param is provided without amount", async () => {
    const url = new URL("http://localhost/api/og");
    url.searchParams.set("status", "Shipped");

    const request = new Request(url.toString());
    const response = await GET(request as Parameters<typeof GET>[0]);

    expect(response.status).toBe(200);
  });
});
