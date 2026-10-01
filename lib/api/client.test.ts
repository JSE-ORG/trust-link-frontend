import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ApiConfigurationError,
  ApiError,
  ApiNetworkError,
  createApiClient,
  normalizeVendorAnalyticsResponse,
} from "./client";

const fetchMock = vi.fn();

const escrow = {
  id: "e1",
  vendorId: "v1",
  amount: 10,
  item: "Item",
  status: "PENDING",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  history: [],
};

const dispute = {
  id: "d1",
  escrowId: "e1",
  escrow,
  buyerId: "b1",
  reason: "Missing item",
  evidence: [],
  status: "OPEN",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const tracking = {
  escrowId: "e1",
  status: "IN_TRANSIT",
  carrier: "GIGL",
  trackingNumber: "track-1",
  events: [],
};

function mockResponse(body: unknown, { ok = true, status = 200, statusText = "OK" }: { ok?: boolean; status?: number; statusText?: string } = {}) {
  return {
    ok,
    status,
    statusText,
    text: async () => (body ? JSON.stringify(body) : ""),
  } as unknown as Response;
}

const API_URL_ENV_VAR = "NEXT_PUBLIC_API_URL";
const originalApiUrl = process.env[API_URL_ENV_VAR];

beforeEach(() => {
  fetchMock.mockReset();
  process.env[API_URL_ENV_VAR] = "http://localhost:3000/api";
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  if (originalApiUrl === undefined) {
    delete process.env[API_URL_ENV_VAR];
  } else {
    process.env[API_URL_ENV_VAR] = originalApiUrl;
  }
});

describe("api client", () => {
  it.each(["dailyMetrics", "series", "data"] as const)(
    "normalizes analytics %s into dataPoints",
    (field) => {
      const point = {
        date: "2026-01-01",
        transactionVolume: 10,
        averageOrderValue: 5,
        completionRate: 1,
        disputeRate: 0,
      };

      expect(normalizeVendorAnalyticsResponse({ [field]: [point] })).toMatchObject({
        dataPoints: [point],
      });
    }
  );

  it("injects the auth header automatically from the client token", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(escrow));

    const client = createApiClient("jht-123");
    await client.getEscrow("e1");

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Headers).get("Authorization")).toBe("Bearer jht-123");
  });

  it("returns typed JSON and surfaces ApiError on failure", async () => {
    fetchMock.mockResolvedValue(mockResponse({ message: "bad" }, { ok: false, status: 400, statusText: "Bad Request" }));

    const client = createApiClient();

    await expect(client.getEscrow("bad")).rejects.toBeInstanceOf(ApiError);
    await expect(client.getEscrow("bad")).rejects.toMatchObject({ status: 400 });
  });

  it("supports the dispute and shipping helpers", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(dispute))
      .mockResolvedValueOnce(mockResponse(tracking));

    const client = createApiClient("jwt-456");
    await expect(client.createDispute("e1", { reason: "late", description: "late", evidence: ["a"] })).resolves.toMatchObject({ id: "d1" });
    await expect(client.shipEscrow("e1", { trackingId: "t1", carrier: "UPS" })).resolves.toMatchObject({ escrowId: "e1" });
  });

  it("rejects a successful response with an invalid escrow shape", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ id: "e1" }));

    await expect(createApiClient().getEscrow("e1")).rejects.toThrow(
      "Invalid API response for /escrow/e1: unexpected response shape"
    );
  });

  // New tests for acceptance criteria

  it("parses JSON error responses into ApiError with message", async () => {
    fetchMock
      .mockResolvedValueOnce(
        mockResponse({ message: "Not Found" }, { ok: false, status: 404, statusText: "Not Found" })
      )
      .mockResolvedValueOnce(
        mockResponse({ message: "Not Found" }, { ok: false, status: 404, statusText: "Not Found" })
      );

    const client = createApiClient();
    const error = await client.getEscrow("missing").catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.message).toContain("Not Found");
  });

  it("parses non-JSON (plain text) error responses into ApiError", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => "Server exploded",
    } as unknown as Response);

    const client = createApiClient();
    const error = await client.getEscrow("boom").catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(500);
    expect(error.message).toContain("Server exploded");
  });

  it("falls back from /escrow/{id} to /escrows/{id} on 404", async () => {
    fetchMock
      .mockResolvedValueOnce(
        mockResponse({ message: "Not Found" }, { ok: false, status: 404, statusText: "Not Found" })
      )
      .mockResolvedValueOnce(mockResponse(escrow));

    const client = createApiClient();
    const result = await client.getEscrow("e1");

    expect(result).toEqual(escrow);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][0]).toContain("/escrow/e1");
    expect(fetchMock.mock.calls[1][0]).toContain("/escrows/e1");
  });

  it("does not set an Authorization header when no token is provided", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(escrow));

    const client = createApiClient();
    await client.getEscrow("e1");

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = init.headers as Headers;
    expect(headers.get("Authorization")).toBeNull();
  });
});

describe("base URL configuration", () => {
  it("fails fast with an actionable message when the env var is unset", async () => {
    delete process.env[API_URL_ENV_VAR];

    const error = await createApiClient().getEscrow("e1").catch((e) => e);

    expect(error).toBeInstanceOf(ApiConfigurationError);
    expect(error.message).toContain(API_URL_ENV_VAR);
    expect(error.message).toContain(".env.local");
    // The whole point of the guard: never build a "undefined/escrow/e1" URL.
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("treats a blank env var as missing", async () => {
    process.env[API_URL_ENV_VAR] = "   ";

    await expect(createApiClient().getEscrow("e1")).rejects.toBeInstanceOf(
      ApiConfigurationError,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("trims a trailing slash so paths are not doubled up", async () => {
    process.env[API_URL_ENV_VAR] = "https://api.trustlink.app/";
    fetchMock.mockResolvedValueOnce(mockResponse(escrow));

    await createApiClient().getEscrow("e1");

    expect(fetchMock.mock.calls[0][0]).toBe(
      "https://api.trustlink.app/escrow/e1",
    );
  });
});

describe("network failures", () => {
  it("wraps a fetch rejection, naming the endpoint and keeping the cause", async () => {
    const cause = new TypeError("fetch failed");
    fetchMock.mockRejectedValueOnce(cause);

    const error = await createApiClient().getEscrow("e1").catch((e) => e);

    expect(error).toBeInstanceOf(ApiNetworkError);
    // A network failure never reached the API, so there is no HTTP status.
    expect(error.status).toBe(0);
    expect(error.message).toContain("/escrow/e1");
    expect(error.message).toContain("fetch failed");
    expect(error.cause).toBe(cause);
  });

  it("wraps a non-Error rejection instead of leaking it", async () => {
    fetchMock.mockRejectedValueOnce("connection reset");

    const error = await createApiClient().getEscrow("e1").catch((e) => e);

    expect(error).toBeInstanceOf(ApiNetworkError);
    expect(error.message).toContain("connection reset");
  });
});

describe("error message extraction", () => {
  it.each([
    [{ error: "boom" }, "boom"],
    [{ details: "too many attempts" }, "too many attempts"],
  ])("reads %o into the message", async (body, expected) => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(body, { ok: false, status: 400, statusText: "Bad Request" }),
    );

    const error = await createApiClient().getEscrow("e1").catch((e) => e);

    expect(error.message).toBe(expected);
    expect(error.body).toMatchObject(body);
  });

  it("never renders [object Object] when the body has no message field", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(
        { unexpected: "shape" },
        { ok: false, status: 422, statusText: "Unprocessable Entity" },
      ),
    );

    const error = await createApiClient().getEscrow("e1").catch((e) => e);

    expect(error.message).toBe("Unprocessable Entity");
    expect(error.message).not.toContain("[object Object]");
    expect(error.status).toBe(422);
  });

  it.each([
    ["null", null],
    ["a number", 42],
    ["an array", [{ message: "nested" }]],
  ])("falls back to the status text for %s body", async (_label, body) => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(body, { ok: false, status: 400, statusText: "Bad Request" }),
    );

    const error = await createApiClient().getEscrow("e1").catch((e) => e);

    expect(error.message).toBe("Bad Request");
    expect(error.message).not.toContain("[object Object]");
  });

  it("falls back to the status code when the response has no status text", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(null, { ok: false, status: 502, statusText: "" }),
    );

    const error = await createApiClient().getEscrow("e1").catch((e) => e);

    expect(error.message).toBe("Request failed with status 502");
  });

  it("uses a JSON string body as the message", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse("upstream is down", { ok: false, status: 503 }),
    );

    const error = await createApiClient().getEscrow("e1").catch((e) => e);

    expect(error.message).toBe("upstream is down");
  });

  it("keeps the parsed body for a JSON error payload", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse(
        { message: "Escrow already released", statusCode: 409 },
        { ok: false, status: 409, statusText: "Conflict" },
      ),
    );

    const error = await createApiClient().getEscrow("e1").catch((e) => e);

    expect(error.status).toBe(409);
    expect(error.body).toEqual({
      message: "Escrow already released",
      statusCode: 409,
    });
  });

  it("survives a body stream that fails mid-read", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      text: async () => {
        throw new Error("stream closed");
      },
    } as unknown as Response);

    const error = await createApiClient().getEscrow("e1").catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(500);
    expect(error.message).toBe("Internal Server Error");
  });
});
