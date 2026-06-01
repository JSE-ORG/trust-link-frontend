import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  createApiClient,
  createDispute,
  createEscrow,
  confirmDelivery,
  getDispute,
  getEscrow,
  getVendorEscrows,
  resolveDispute,
  shipEscrow,
  setApiToken,
} from "./api";
import type { Dispute, Escrow } from "@/types";
import type { EscrowInput, EscrowResponse } from "@/types/escrow";

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  setApiToken(null);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("API client", () => {
  const mockEscrow: Escrow = {
    id: "escrow-1",
    vendorId: "vendor-1",
    amount: 100,
    item: "Test item",
    status: "FUNDED",
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-06-01T00:00:00Z",
    history: [],
  };

  const mockDispute: Dispute = {
    id: "dispute-1",
    escrowId: "escrow-1",
    escrow: mockEscrow,
    buyerId: "buyer-1",
    reason: "Damaged item",
    evidence: [],
    status: "OPEN",
    createdAt: "2026-06-01T00:00:00Z",
    updatedAt: "2026-06-01T00:00:00Z",
  };

  it("fetches an escrow using getEscrow", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => mockEscrow,
    });

    const result = await getEscrow("escrow-1");

    expect(result).toEqual(mockEscrow);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/escrows/escrow-1"), expect.objectContaining({ cache: "no-store" }));
  });

  it("creates an escrow using createEscrow", async () => {
    const payload: EscrowInput = {
      itemName: "Test item",
      priceUSDC: "100",
      description: "A test escrow",
      shippingWindow: "2-3 days",
    };
    const response: EscrowResponse = { url: "https://trustlink.example.com/escrow/123" };

    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => response,
    });

    const result = await createEscrow(payload);

    expect(result).toEqual(response);
    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect(options?.method).toBe("POST");
    expect((options?.headers as Headers).get("Content-Type")).toBe("application/json");
  });

  it("ships an escrow using shipEscrow", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => mockEscrow,
    });

    const result = await shipEscrow("escrow-1", "TRACK123", "GIGL");

    expect(result).toEqual(mockEscrow);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/escrow/escrow-1/ship"), expect.objectContaining({ method: "PATCH" }));
  });

  it("confirms delivery using confirmDelivery", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => mockEscrow,
    });

    const result = await confirmDelivery("escrow-1");

    expect(result).toEqual(mockEscrow);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/escrows/escrow-1/confirm"), expect.objectContaining({ method: "POST" }));
  });

  it("creates a dispute using createDispute", async () => {
    const formData = new FormData();
    formData.append("escrowId", "escrow-1");
    formData.append("reason", "Item arrived damaged");

    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => mockDispute,
    });

    const result = await createDispute(formData);

    expect(result).toEqual(mockDispute);
    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect(options?.method).toBe("POST");
    expect((options?.headers as Headers).has("Content-Type")).toBe(false);
  });

  it("fetches a dispute using getDispute", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => mockDispute,
    });

    const result = await getDispute("dispute-1");

    expect(result).toEqual(mockDispute);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/disputes/dispute-1"), expect.objectContaining({ cache: "no-store" }));
  });

  it("resolves a dispute using resolveDispute", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => ({ ...mockDispute, status: "RESOLVED", resolution: "RELEASE_TO_VENDOR" }),
    });

    const result = await resolveDispute("dispute-1", "RELEASE_TO_VENDOR");

    expect(result.status).toBe("RESOLVED");
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/disputes/dispute-1/resolve"), expect.objectContaining({ method: "PATCH" }));
  });

  it("fetches vendor escrows using getVendorEscrows", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => [mockEscrow],
    });

    const result = await getVendorEscrows();

    expect(result).toEqual([mockEscrow]);
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/vendor/escrows"), expect.objectContaining({ cache: "no-store" }));
  });

  it("injects auth header when token is set globally", async () => {
    setApiToken("jwt-token");

    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => mockEscrow,
    });

    await getEscrow("escrow-1");

    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect((options?.headers as Headers).get("Authorization")).toBe("Bearer jwt-token");
  });

  it("throws ApiError when backend returns non-ok status with JSON body", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: { get: () => "application/json" },
      json: async () => ({ message: "Bad request" }),
    });

    await expect(getEscrow("escrow-1")).rejects.toEqual({
      status: 400,
      message: "Bad request",
      details: { message: "Bad request" },
    } as ApiError);
  });

  it("creates a client with explicit token override", async () => {
    const client = createApiClient("explicit-token");
    fetchMock.mockResolvedValueOnce({
      ok: true,
      headers: { get: () => "application/json" },
      json: async () => mockEscrow,
    });

    await client.getEscrow("escrow-1");

    const options = fetchMock.mock.calls[0][1] as RequestInit;
    expect((options?.headers as Headers).get("Authorization")).toBe("Bearer explicit-token");
  });
});
