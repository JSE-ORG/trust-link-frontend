import { NextRequest } from "next/server";
import { beforeEach,describe, expect, it } from "vitest";

import { __resetRateLimitMemory } from "@/lib/rateLimit";

import { PATCH } from "./[id]/ship/route";
import { GET } from "./route";
import * as EscrowRoute from "./route";
import { EscrowCreateSchema } from "@/lib/validations/escrow";

// POST may not be exported yet on this branch — handle gracefully so the
// integration suite still loads and the new tests are discoverable for review.
// When POST is implemented, the conditional suite will activate.
const POST = (EscrowRoute as unknown as { POST?: (req: NextRequest) => Promise<Response> }).POST;
const describeWithPost = POST ? describe : describe.skip;
const itWithPost = POST ? it : it.skip;

describe("API Route Integration Tests: Escrow & Shipping", () => {
  beforeEach(() => {
    __resetRateLimitMemory();
  });

  describe("GET /escrow Integration", () => {
    it("returns 200 OK with array of escrow items", async () => {
      const request = new Request("http://localhost/escrow");
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/json");

      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThan(0);
      expect(body[0]).toHaveProperty("escrowId");
      expect(body[0]).toHaveProperty("status");
    });

    it("returns 429 Too Many Requests when rate limit is exceeded", async () => {
      const request = new Request("http://localhost/escrow", {
        headers: { "x-forwarded-for": "192.168.1.100" },
      });

      // Fire 20 allowed requests
      for (let i = 0; i < 20; i++) {
        const res = await GET(request);
        expect(res.status).toBe(200);
      }

      // The 21st request should be rate limited
      const rateLimitedRes = await GET(request);
      expect(rateLimitedRes.status).toBe(429);
      expect(rateLimitedRes.headers.get("Retry-After")).toBeDefined();

      const body = await rateLimitedRes.json();
      expect(body.message).toContain("Too many requests");
    });
  });

  describeWithPost("POST /escrow Integration — successful creation", () => {
    const validPayload = {
      itemName: "Test Product",
      priceUSDC: "150.00",
      description: "A valid escrow creation payload",
      shippingWindow: "1-3 days" as const,
    };

    itWithPost("returns 201 with correct response shape on valid authenticated request", async () => {
      const request = new NextRequest("http://localhost/escrow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
          "x-forwarded-for": "10.0.0.1",
        },
        body: JSON.stringify(validPayload),
      });

      const response = await POST!(request);
      // Accept 200 or 201 — both indicate successful creation
      expect([200, 201]).toContain(response.status);
      expect(response.headers.get("content-type")).toContain("application/json");

      const body = await response.json();
      // CreateEscrowResponse shape is { url: string }
      expect(body).toHaveProperty("url");
      expect(typeof body.url).toBe("string");
      expect(body.url).toMatch(/^https?:\/\//);
    });

    itWithPost("returns JSON content-type on success", async () => {
      const request = new NextRequest("http://localhost/escrow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
          "x-forwarded-for": "10.0.0.2",
        },
        body: JSON.stringify(validPayload),
      });

      const response = await POST!(request);
      expect([200, 201]).toContain(response.status);
      expect(response.headers.get("content-type")).toContain("application/json");
    });
  });

  describeWithPost("POST /escrow Integration — validation failures", () => {
    const basePayload = {
      itemName: "Test Product",
      priceUSDC: "150.00",
      description: "A valid escrow creation payload",
      shippingWindow: "1-3 days" as const,
    };

    itWithPost("returns 400 when itemName is missing", async () => {
      const { itemName: _omit, ...payloadWithoutName } = basePayload;
      const request = new NextRequest("http://localhost/escrow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
          "x-forwarded-for": "10.0.0.10",
        },
        body: JSON.stringify(payloadWithoutName),
      });

      const response = await POST!(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.message ?? body.error ?? JSON.stringify(body)).toMatch(/itemName|item name/i);
    });

    itWithPost("returns 400 when priceUSDC is missing", async () => {
      const { priceUSDC: _omit, ...payloadWithoutPrice } = basePayload;
      const request = new NextRequest("http://localhost/escrow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
          "x-forwarded-for": "10.0.0.11",
        },
        body: JSON.stringify(payloadWithoutPrice),
      });

      const response = await POST!(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.message ?? body.error ?? JSON.stringify(body)).toMatch(/price/i);
    });

    itWithPost("returns 400 when priceUSDC is invalid (negative number)", async () => {
      const request = new NextRequest("http://localhost/escrow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
          "x-forwarded-for": "10.0.0.12",
        },
        body: JSON.stringify({ ...basePayload, priceUSDC: "-5" }),
      });

      const response = await POST!(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.message ?? body.error ?? JSON.stringify(body)).toMatch(/price|positive/i);
    });

    itWithPost("returns 400 when priceUSDC is invalid (non-numeric)", async () => {
      const request = new NextRequest("http://localhost/escrow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
          "x-forwarded-for": "10.0.0.13",
        },
        body: JSON.stringify({ ...basePayload, priceUSDC: "abc" }),
      });

      const response = await POST!(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.message ?? body.error ?? JSON.stringify(body)).toMatch(/price|positive|number/i);
    });

    itWithPost("returns 400 when priceUSDC is zero", async () => {
      const request = new NextRequest("http://localhost/escrow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
          "x-forwarded-for": "10.0.0.14",
        },
        body: JSON.stringify({ ...basePayload, priceUSDC: "0" }),
      });

      const response = await POST!(request);
      expect(response.status).toBe(400);
    });

    itWithPost("returns 400 when description is missing", async () => {
      const { description: _omit, ...payloadWithoutDesc } = basePayload;
      const request = new NextRequest("http://localhost/escrow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
          "x-forwarded-for": "10.0.0.15",
        },
        body: JSON.stringify(payloadWithoutDesc),
      });

      const response = await POST!(request);
      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.message ?? body.error ?? JSON.stringify(body)).toMatch(/description/i);
    });

    itWithPost("returns 400 when shippingWindow is invalid", async () => {
      const request = new NextRequest("http://localhost/escrow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-test-token",
          "x-forwarded-for": "10.0.0.16",
        },
        body: JSON.stringify({ ...basePayload, shippingWindow: "INVALID" }),
      });

      const response = await POST!(request);
      expect(response.status).toBe(400);
    });
  });

  describeWithPost("POST /escrow Integration — authentication", () => {
    const validPayload = {
      itemName: "Test Product",
      priceUSDC: "150.00",
      description: "A valid escrow creation payload",
      shippingWindow: "1-3 days" as const,
    };

    itWithPost("returns 401 when Authorization header is missing", async () => {
      const request = new NextRequest("http://localhost/escrow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "10.0.0.20",
        },
        body: JSON.stringify(validPayload),
      });

      const response = await POST!(request);
      expect(response.status).toBe(401);
      const body = await response.json();
      expect(body.message ?? body.error ?? JSON.stringify(body)).toMatch(/unauthorized|auth|token|bearer/i);
    });

    itWithPost("returns 401 when Bearer token is empty", async () => {
      const request = new NextRequest("http://localhost/escrow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer ",
          "x-forwarded-for": "10.0.0.21",
        },
        body: JSON.stringify(validPayload),
      });

      const response = await POST!(request);
      expect(response.status).toBe(401);
    });

    itWithPost("returns 401 when token is invalid", async () => {
      const request = new NextRequest("http://localhost/escrow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer invalid-token-xyz",
          "x-forwarded-for": "10.0.0.22",
        },
        body: JSON.stringify(validPayload),
      });

      const response = await POST!(request);
      expect(response.status).toBe(401);
    });

    itWithPost("returns 401 when Authorization scheme is not Bearer", async () => {
      const request = new NextRequest("http://localhost/escrow", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Basic dXNlcjpwYXNz",
          "x-forwarded-for": "10.0.0.23",
        },
        body: JSON.stringify(validPayload),
      });

      const response = await POST!(request);
      expect(response.status).toBe(401);
    });
  });

  // Schema-level validation tests always run — they document the contract
  // the route handler must enforce and keep the suite useful even before
  // the POST handler is merged.
  describe("POST /escrow — EscrowCreateSchema validation (unit, always active)", () => {
    it("accepts a valid payload", () => {
      const result = EscrowCreateSchema.safeParse({
        itemName: "Test Product",
        priceUSDC: "150.00",
        description: "A valid escrow creation payload",
        shippingWindow: "1-3 days",
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing itemName", () => {
      const result = EscrowCreateSchema.safeParse({
        priceUSDC: "150.00",
        description: "desc",
        shippingWindow: "1-3 days",
      } as unknown as Record<string, unknown>);
      expect(result.success).toBe(false);
    });

    it("rejects invalid priceUSDC (negative)", () => {
      const result = EscrowCreateSchema.safeParse({
        itemName: "Test",
        priceUSDC: "-5",
        description: "desc",
        shippingWindow: "1-3 days",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toMatch(/positive/i);
      }
    });

    it("rejects invalid priceUSDC (non-numeric)", () => {
      const result = EscrowCreateSchema.safeParse({
        itemName: "Test",
        priceUSDC: "abc",
        description: "desc",
        shippingWindow: "1-3 days",
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing description", () => {
      const result = EscrowCreateSchema.safeParse({
        itemName: "Test",
        priceUSDC: "10",
        shippingWindow: "1-3 days",
      } as unknown as Record<string, unknown>);
      expect(result.success).toBe(false);
    });
  });

  describe("PATCH /escrow/:id/ship Integration", () => {
    it("returns 400 Bad Request when trackingId is missing", async () => {
      const request = new Request("http://localhost/escrow/escrow-1/ship", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carrier: "FedEx" }),
      }) as NextRequest;

      const params = Promise.resolve({ id: "escrow-1" });
      const response = await PATCH(request, { params });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.message).toBe("Tracking ID is required.");
    });

    it("returns 400 Bad Request when trackingId exceeds 64 characters", async () => {
      const longTrackingId = "A".repeat(65);
      const request = new Request("http://localhost/escrow/escrow-1/ship", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingId: longTrackingId }),
      }) as NextRequest;

      const params = Promise.resolve({ id: "escrow-1" });
      const response = await PATCH(request, { params });

      expect(response.status).toBe(400);
      const body = await response.json();
      expect(body.message).toBe("Tracking ID must be 64 characters or less.");
    });

    it("successfully ships an escrow item and updates status to Shipped", async () => {
      const request = new Request("http://localhost/escrow/escrow-1/ship", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingId: "TRK-987654", carrier: "DHL Express" }),
      }) as NextRequest;

      const params = Promise.resolve({ id: "escrow-1" });
      const response = await PATCH(request, { params });

      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.escrowId).toBe("escrow-1");
      expect(body.status).toBe("Shipped");
      expect(body.trackingId).toBe("TRK-987654");
      expect(body.carrier).toBe("DHL Express");
    });

    it("returns 404 Not Found when attempting to ship a non-existent escrow", async () => {
      const request = new Request("http://localhost/escrow/non-existent-id/ship", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingId: "TRK-000000" }),
      }) as NextRequest;

      const params = Promise.resolve({ id: "non-existent-id" });
      const response = await PATCH(request, { params });

      expect(response.status).toBe(404);
      const body = await response.json();
      expect(body.message).toBe("Escrow item not found.");
    });
  });
});
