import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "./route";

vi.mock("@/lib/escrowStore", () => ({
  shipEscrow: vi.fn(),
}));

import { shipEscrow } from "@/lib/escrowStore";

describe("PATCH /api/escrow/:id/ship", () => {
  beforeEach(() => {
    vi.mocked(shipEscrow).mockReset();
  });

  it("rejects requests without a tracking id", async () => {
    const request = new Request("http://localhost/api/escrow/escrow-1/ship", {
      method: "PATCH",
      body: JSON.stringify({ carrier: "DHL" }),
    });

    const response = await PATCH(request, { params: { id: "escrow-1" } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ message: "Tracking ID is required." });
    expect(shipEscrow).not.toHaveBeenCalled();
  });

  it("rejects tracking ids longer than 64 characters", async () => {
    const request = new Request("http://localhost/api/escrow/escrow-1/ship", {
      method: "PATCH",
      body: JSON.stringify({ trackingId: "x".repeat(65) }),
    });

    const response = await PATCH(request, { params: { id: "escrow-1" } });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body).toEqual({ message: "Tracking ID must be 64 characters or less." });
    expect(shipEscrow).not.toHaveBeenCalled();
  });

  it("ships an escrow and returns the updated record", async () => {
    const updatedItem = {
      escrowId: "escrow-1",
      vendor: "Alliance Logistics",
      orders: 24,
      status: "Shipped",
      trackingId: "TRACK-123",
      carrier: "Other",
    };
    vi.mocked(shipEscrow).mockReturnValue(updatedItem);

    const request = new Request("http://localhost/api/escrow/escrow-1/ship", {
      method: "PATCH",
      body: JSON.stringify({ trackingId: "  TRACK-123  " }),
    });

    const response = await PATCH(request, { params: { id: "escrow-1" } });
    const body = await response.json();

    expect(shipEscrow).toHaveBeenCalledWith("escrow-1", "TRACK-123", "Other");
    expect(response.status).toBe(200);
    expect(body).toEqual(updatedItem);
  });

  it("returns a 404 when the escrow cannot be shipped", async () => {
    vi.mocked(shipEscrow).mockImplementation(() => {
      throw new Error("Escrow item not found.");
    });

    const request = new Request("http://localhost/api/escrow/escrow-1/ship", {
      method: "PATCH",
      body: JSON.stringify({ trackingId: "TRACK-123" }),
    });

    const response = await PATCH(request, { params: { id: "missing" } });
    const body = await response.json();

    expect(response.status).toBe(404);
    expect(body).toEqual({ message: "Escrow item not found." });
  });
});
