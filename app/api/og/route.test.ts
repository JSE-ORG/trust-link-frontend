import { isValidElement, type ReactElement, type ReactNode } from "react";
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

import { boundOgText, GET, OG_BOUNDS } from "./route";

function getRenderedText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(getRenderedText).join(" ").replace(/\s+/g, " ");
  }
  if (isValidElement<{ children?: ReactNode }>(node)) {
    return getRenderedText(node.props.children);
  }
  return "";
}

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
      element: ReactElement<{
        style: Record<string, unknown>;
        children: React.ReactNode[];
      }>;
      options: { width: number; height: number };
    };

    expect(imageResp.options.width).toBe(1200);
    expect(imageResp.options.height).toBe(630);
    expect(imageResp.element.props.style.backgroundColor).toBe("#1B2A6B");

    const elementStr = getRenderedText(imageResp.element);
    const statusMatches = elementStr.match(/Status:\s*Funded/g);
    expect(statusMatches).toHaveLength(1);
  });

  it("bounds oversized title, amount, and status inputs before rendering", async () => {
    const url = new URL("http://localhost/api/og");
    const longTitle = "A".repeat(200);
    const longAmount = "9".repeat(100);
    const longStatus = "S".repeat(80);

    url.searchParams.set("title", longTitle);
    url.searchParams.set("amount", longAmount);
    url.searchParams.set("status", longStatus);

    const response = await GET(authedRequest(url.toString()) as Parameters<typeof GET>[0]);
    expect(response.status).toBe(200);

    const imageResp = response as unknown as {
      element: ReactElement<{
        style: Record<string, unknown>;
        children: React.ReactNode[];
      }>;
    };

    const elementStr = getRenderedText(imageResp.element);

    // Title should be truncated to MAX_TITLE_LENGTH (100)
    expect(elementStr).toContain("A".repeat(OG_BOUNDS.MAX_TITLE_LENGTH));
    expect(elementStr).not.toContain("A".repeat(OG_BOUNDS.MAX_TITLE_LENGTH + 1));

    // Amount should be truncated to MAX_AMOUNT_LENGTH (32)
    expect(elementStr).toContain(`Amount: ${"9".repeat(OG_BOUNDS.MAX_AMOUNT_LENGTH)} USDC`);
    expect(elementStr).not.toContain("9".repeat(OG_BOUNDS.MAX_AMOUNT_LENGTH + 1));

    // Status should be truncated to MAX_STATUS_LENGTH (30)
    expect(elementStr).toContain(`Status: ${"S".repeat(OG_BOUNDS.MAX_STATUS_LENGTH)}`);
    expect(elementStr).not.toContain("S".repeat(OG_BOUNDS.MAX_STATUS_LENGTH + 1));
  });

  it("preserves inputs at exact maximum boundaries", async () => {
    const exactTitle = "T".repeat(OG_BOUNDS.MAX_TITLE_LENGTH);
    const exactAmount = "1".repeat(OG_BOUNDS.MAX_AMOUNT_LENGTH);
    const exactStatus = "F".repeat(OG_BOUNDS.MAX_STATUS_LENGTH);

    const url = new URL("http://localhost/api/og");
    url.searchParams.set("title", exactTitle);
    url.searchParams.set("amount", exactAmount);
    url.searchParams.set("status", exactStatus);

    const response = await GET(authedRequest(url.toString()) as Parameters<typeof GET>[0]);
    expect(response.status).toBe(200);

    const imageResp = response as unknown as {
      element: ReactElement<{
        style: Record<string, unknown>;
        children: React.ReactNode[];
      }>;
    };
    const elementStr = getRenderedText(imageResp.element);
    expect(elementStr).toContain(exactTitle);
    expect(elementStr).toContain(`Amount: ${exactAmount} USDC`);
    expect(elementStr).toContain(`Status: ${exactStatus}`);
  });

  it("handles Unicode text and multi-byte emojis correctly without splitting surrogate pairs", async () => {
    const url = new URL("http://localhost/api/og");
    const emojiTitle = "🛡️".repeat(120);
    url.searchParams.set("title", emojiTitle);

    const response = await GET(authedRequest(url.toString()) as Parameters<typeof GET>[0]);
    expect(response.status).toBe(200);

    const imageResp = response as unknown as {
      element: ReactElement<{
        style: Record<string, unknown>;
        children: React.ReactNode[];
      }>;
    };
    const elementStr = getRenderedText(imageResp.element);
    const expectedEmojiTitle = Array.from(emojiTitle)
      .slice(0, OG_BOUNDS.MAX_TITLE_LENGTH)
      .join("");
    expect(elementStr).toContain(expectedEmojiTitle);
  });

  it("falls back to default title and omits empty sections on whitespace inputs", async () => {
    const url = new URL("http://localhost/api/og");
    url.searchParams.set("title", "   ");
    url.searchParams.set("amount", "   ");
    url.searchParams.set("status", "   ");

    const response = await GET(authedRequest(url.toString()) as Parameters<typeof GET>[0]);
    expect(response.status).toBe(200);

    const imageResp = response as unknown as {
      element: React.ReactElement<{
        style: Record<string, unknown>;
        children: React.ReactNode[];
      }>;
    };
    const elementStr = JSON.stringify(imageResp.element);
    expect(elementStr).toContain("TrustLink Escrow");
    expect(elementStr).not.toContain("Amount:");
    expect(elementStr).not.toContain("Status:");
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

describe("boundOgText helper", () => {
  it("returns null for null, undefined or whitespace", () => {
    expect(boundOgText(null, 10)).toBeNull();
    expect(boundOgText(undefined, 10)).toBeNull();
    expect(boundOgText("", 10)).toBeNull();
    expect(boundOgText("   ", 10)).toBeNull();
  });

  it("preserves strings within limit and trims surrounding whitespace", () => {
    expect(boundOgText("  hello  ", 10)).toBe("hello");
    expect(boundOgText("exact10ch!", 10)).toBe("exact10ch!");
  });

  it("truncates strings exceeding limit", () => {
    expect(boundOgText("longerthanlimit", 5)).toBe("longe");
  });
});
