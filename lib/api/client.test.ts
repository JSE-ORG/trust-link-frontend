import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { ApiError, createApiClient } from "./client";

const fetchMock = vi.fn();

function mockResponse(body: unknown, { ok = true, status = 200, statusText = "OK" }: { ok?: boolean; status?: number; statusText?: string } = {}) {
  return {
    ok,
    status,
    statusText,
    text: async () => (body ? JSON.stringify(body) : ""),
  } as unknown as Response;
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("api client", () => {
  it("injects the auth header automatically from the client token", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ ok: true }));

    const client = createApiClient("jwt-123");
    await client.getEscrow("e1");

    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect((init.headers as Headers).get("Authorization")).toBe("Bearer jwt-123");
  });

  it("returns typed JSON and surfaces ApiError on failure", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ message: "bad" }, { ok: false, status: 400, statusText: "Bad Request" }));

    const client = createApiClient();

    await expect(client.getEscrow("bad")).rejects.toBeInstanceOf(ApiError);
    await expect(client.getEscrow("bad")).rejects.toMatchObject({ status: 400 });
  });

  it("supports the dispute and shipping helpers", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse({ id: "d1" }))
      .mockResolvedValueOnce(mockResponse({ escrowId: "e1" }));

    const client = createApiClient("jwt-456");
    await expect(client.createDispute("e1", { reason: "late", description: "late", evidence: ["a"] })).resolves.toEqual({ id: "d1" });
    await expect(client.shipEscrow("e1", { trackingId: "t1", carrier: "UPS" })).resolves.toEqual({ escrowId: "e1" });
  });
});
