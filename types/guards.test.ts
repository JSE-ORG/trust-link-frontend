import { describe, expect, it } from "vitest";

import { isDispute, isEscrow, isSubscription, isTracking } from "./guards";

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

describe("API response guards", () => {
  it("validates escrow required fields", () => {
    expect(isEscrow(escrow)).toBe(true);
    expect(isEscrow({ ...escrow, amount: "10" })).toBe(false);
  });

  it("validates dispute required fields", () => {
    const dispute = {
      id: "d1",
      escrowId: "e1",
      escrow,
      buyerId: "b1",
      reason: "Missing item",
      evidence: ["https://example.com/evidence"],
      status: "OPEN",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    expect(isDispute(dispute)).toBe(true);
    expect(isDispute({ ...dispute, evidence: [1] })).toBe(false);
  });

  it("validates tracking required fields", () => {
    const tracking = {
      escrowId: "e1",
      status: "IN_TRANSIT",
      carrier: "GIGL",
      trackingNumber: "track-1",
      events: [],
    };
    expect(isTracking(tracking)).toBe(true);
    expect(isTracking({ ...tracking, carrier: null })).toBe(false);
  });

  it("validates subscription required fields", () => {
    expect(isSubscription({ plan: "PRO", vendorId: "v1" })).toBe(true);
    expect(isSubscription({ plan: "ENTERPRISE", vendorId: "v1" })).toBe(false);
  });
});
