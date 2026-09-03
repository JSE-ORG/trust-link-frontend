import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

vi.mock("@/lib/api", () => ({
  getVendorEscrows: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  enforceRateLimit: vi.fn().mockResolvedValue(null),
}));

import { getVendorEscrows } from "@/lib/api";

describe("GET /api/escrow", () => {
  beforeEach(() => {
    vi.mocked(getVendorEscrows).mockReset();
  });

  it("returns escrow items with a 200 status", async () => {
    const escrowItems = [
      { escrowId: "escrow-1", vendor: "Alliance Logistics", orders: 24, status: "Ready" },
    ];
    // Changed to mockResolvedValue because the real API functions are asynchronous
    vi.mocked(getVendorEscrows).mockResolvedValue(escrowItems as any);

    const response = await GET(new Request("https://test.local/escrow"));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(escrowItems);
  });
});
