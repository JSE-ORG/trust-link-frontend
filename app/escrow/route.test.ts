import { describe, expect, it, vi, beforeEach } from "vitest";
import { GET } from "./route";

vi.mock("@/lib/escrowStore", () => ({
  getEscrowItems: vi.fn(),
}));

import { getEscrowItems } from "@/lib/escrowStore";

describe("GET /api/escrow", () => {
  beforeEach(() => {
    vi.mocked(getEscrowItems).mockReset();
  });

  it("returns escrow items with a 200 status", async () => {
    const escrowItems = [
      { escrowId: "escrow-1", vendor: "Alliance Logistics", orders: 24, status: "Ready" },
    ];
    vi.mocked(getEscrowItems).mockReturnValue(escrowItems);

    const response = GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual(escrowItems);
  });
});
