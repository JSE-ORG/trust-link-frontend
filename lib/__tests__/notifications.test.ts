import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Escrow } from "@/types";

import {
  deriveNotifications,
  getReadIds,
  relativeTime,
  saveReadIds,
  statusLabel,
} from "../notifications";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal Escrow fixture, merging any overrides supplied by the caller. */
function makeEscrow(overrides: Partial<Escrow> = {}): Escrow {
  return {
    id: "escrow-1",
    vendorId: "vendor-1",
    amount: 100,
    item: "Test Item",
    status: "PENDING",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    history: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// deriveNotifications
// ---------------------------------------------------------------------------

describe("deriveNotifications", () => {
  it("returns an empty array when given an empty escrow list", () => {
    expect(deriveNotifications([])).toEqual([]);
  });

  it("returns an empty array when all escrows have empty history", () => {
    const escrows = [makeEscrow(), makeEscrow({ id: "escrow-2" })];
    expect(deriveNotifications(escrows)).toEqual([]);
  });

  it("maps a single history event to a notification with the correct shape", () => {
    const escrow = makeEscrow({
      id: "escrow-1",
      item: "Handmade Bracelet",
      history: [
        {
          id: "evt-1",
          escrowId: "escrow-1",
          status: "FUNDED",
          timestamp: "2024-06-01T10:00:00.000Z",
          description: "Payment received",
        },
      ],
    });

    const result = deriveNotifications([escrow]);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: "evt-1",
      escrowId: "escrow-1",
      escrowItem: "Handmade Bracelet",
      type: "FUNDED",
      message: "Payment received",
      timestamp: "2024-06-01T10:00:00.000Z",
    });
  });

  it("collects history events from multiple escrows", () => {
    const escrows = [
      makeEscrow({
        id: "escrow-1",
        history: [
          {
            id: "evt-a",
            escrowId: "escrow-1",
            status: "PENDING",
            timestamp: "2024-06-01T08:00:00.000Z",
            description: "Created",
          },
        ],
      }),
      makeEscrow({
        id: "escrow-2",
        history: [
          {
            id: "evt-b",
            escrowId: "escrow-2",
            status: "SHIPPED",
            timestamp: "2024-06-01T09:00:00.000Z",
            description: "Shipped",
          },
        ],
      }),
    ];

    const result = deriveNotifications(escrows);

    expect(result).toHaveLength(2);
    const ids = result.map((n) => n.id);
    expect(ids).toContain("evt-a");
    expect(ids).toContain("evt-b");
  });

  it("sorts notifications by timestamp descending (most recent first)", () => {
    const escrow = makeEscrow({
      history: [
        {
          id: "evt-old",
          escrowId: "escrow-1",
          status: "PENDING",
          timestamp: "2024-01-01T00:00:00.000Z",
          description: "Oldest",
        },
        {
          id: "evt-new",
          escrowId: "escrow-1",
          status: "FUNDED",
          timestamp: "2024-06-01T00:00:00.000Z",
          description: "Newest",
        },
        {
          id: "evt-mid",
          escrowId: "escrow-1",
          status: "SHIPPED",
          timestamp: "2024-03-01T00:00:00.000Z",
          description: "Middle",
        },
      ],
    });

    const result = deriveNotifications([escrow]);

    expect(result.map((n) => n.id)).toEqual(["evt-new", "evt-mid", "evt-old"]);
  });

  it("handles escrows with nullish history gracefully (falls back to empty array)", () => {
    // Cast to bypass TypeScript strict typing — simulates a runtime response where
    // `history` might be null/undefined despite the type definition.
    const escrow = makeEscrow({ history: null as unknown as [] });
    expect(() => deriveNotifications([escrow])).not.toThrow();
    expect(deriveNotifications([escrow])).toEqual([]);
  });

  it("does not include the `read` field on returned notifications", () => {
    const escrow = makeEscrow({
      history: [
        {
          id: "evt-1",
          escrowId: "escrow-1",
          status: "COMPLETED",
          timestamp: "2024-06-01T00:00:00.000Z",
          description: "Done",
        },
      ],
    });

    const [notification] = deriveNotifications([escrow]);

    expect(notification).not.toHaveProperty("read");
  });

  it("interleaves events from multiple escrows correctly when sorting", () => {
    const escrows = [
      makeEscrow({
        id: "escrow-A",
        item: "Item A",
        history: [
          {
            id: "evt-A1",
            escrowId: "escrow-A",
            status: "PENDING",
            timestamp: "2024-05-01T00:00:00.000Z",
            description: "A created",
          },
          {
            id: "evt-A2",
            escrowId: "escrow-A",
            status: "FUNDED",
            timestamp: "2024-05-03T00:00:00.000Z",
            description: "A funded",
          },
        ],
      }),
      makeEscrow({
        id: "escrow-B",
        item: "Item B",
        history: [
          {
            id: "evt-B1",
            escrowId: "escrow-B",
            status: "SHIPPED",
            timestamp: "2024-05-02T00:00:00.000Z",
            description: "B shipped",
          },
        ],
      }),
    ];

    const result = deriveNotifications(escrows);

    expect(result.map((n) => n.id)).toEqual(["evt-A2", "evt-B1", "evt-A1"]);
  });
});

// ---------------------------------------------------------------------------
// statusLabel
// ---------------------------------------------------------------------------

describe("statusLabel", () => {
  it.each([
    ["PENDING", "Escrow created"],
    ["FUNDED", "Payment received"],
    ["SHIPPED", "Order shipped"],
    ["COMPLETED", "Order completed"],
    ["DISPUTED", "Dispute raised"],
    ["RELEASED", "Funds released"],
    ["REFUNDED", "Refund processed"],
    ["EXPIRED", "Escrow expired"],
  ])('returns "%s" for status "%s"', (status, expected) => {
    expect(statusLabel(status)).toBe(expected);
  });

  it("returns the original status string for an unrecognised status code", () => {
    expect(statusLabel("UNKNOWN_STATUS")).toBe("UNKNOWN_STATUS");
  });

  it("returns the original string for an empty status", () => {
    expect(statusLabel("")).toBe("");
  });

  it("is case-sensitive — lowercase variants fall back to the raw value", () => {
    expect(statusLabel("pending")).toBe("pending");
    expect(statusLabel("funded")).toBe("funded");
  });
});

// ---------------------------------------------------------------------------
// relativeTime
// ---------------------------------------------------------------------------

describe("relativeTime", () => {
  beforeEach(() => {
    // Pin Date.now to a fixed point so all relative calculations are deterministic.
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-01T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "just now" for a timestamp within the last minute', () => {
    const ts = new Date("2024-06-01T11:59:30.000Z").toISOString(); // 30 s ago
    expect(relativeTime(ts)).toBe("just now");
  });

  it('returns "just now" for a timestamp equal to now', () => {
    const ts = new Date("2024-06-01T12:00:00.000Z").toISOString();
    expect(relativeTime(ts)).toBe("just now");
  });

  it('returns "1m ago" for exactly 1 minute ago', () => {
    const ts = new Date("2024-06-01T11:59:00.000Z").toISOString();
    expect(relativeTime(ts)).toBe("1m ago");
  });

  it("returns minutes for timestamps within the last hour", () => {
    const ts = new Date("2024-06-01T11:45:00.000Z").toISOString(); // 15 min ago
    expect(relativeTime(ts)).toBe("15m ago");
  });

  it('returns "59m ago" for just under an hour', () => {
    const ts = new Date("2024-06-01T11:01:00.000Z").toISOString(); // 59 min ago
    expect(relativeTime(ts)).toBe("59m ago");
  });

  it('returns "1h ago" for exactly 1 hour ago', () => {
    const ts = new Date("2024-06-01T11:00:00.000Z").toISOString();
    expect(relativeTime(ts)).toBe("1h ago");
  });

  it("returns hours for timestamps within the last day", () => {
    const ts = new Date("2024-06-01T06:00:00.000Z").toISOString(); // 6 h ago
    expect(relativeTime(ts)).toBe("6h ago");
  });

  it('returns "23h ago" for just under a day', () => {
    const ts = new Date("2024-05-31T13:00:00.000Z").toISOString(); // 23 h ago
    expect(relativeTime(ts)).toBe("23h ago");
  });

  it('returns "1d ago" for exactly 24 hours ago', () => {
    const ts = new Date("2024-05-31T12:00:00.000Z").toISOString();
    expect(relativeTime(ts)).toBe("1d ago");
  });

  it("returns days for timestamps older than a day", () => {
    const ts = new Date("2024-05-25T12:00:00.000Z").toISOString(); // 7 days ago
    expect(relativeTime(ts)).toBe("7d ago");
  });

  it("handles an invalid date string without throwing", () => {
    // An unparseable timestamp produces NaN arithmetic; the function should not throw.
    expect(() => relativeTime("not-a-date")).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// getReadIds & saveReadIds  (localStorage)
// ---------------------------------------------------------------------------

describe("getReadIds", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("returns an empty Set when localStorage has no entry", () => {
    const ids = getReadIds();
    expect(ids).toBeInstanceOf(Set);
    expect(ids.size).toBe(0);
  });

  it("returns the persisted set of IDs", () => {
    localStorage.setItem("notifications.read", JSON.stringify(["id-1", "id-2"]));
    const ids = getReadIds();
    expect(ids.has("id-1")).toBe(true);
    expect(ids.has("id-2")).toBe(true);
    expect(ids.size).toBe(2);
  });

  it("returns an empty Set when localStorage contains malformed JSON", () => {
    localStorage.setItem("notifications.read", "not-valid-json{{{");
    const ids = getReadIds();
    expect(ids).toBeInstanceOf(Set);
    expect(ids.size).toBe(0);
  });

  it("returns an empty Set when the stored value is an empty JSON array", () => {
    localStorage.setItem("notifications.read", JSON.stringify([]));
    const ids = getReadIds();
    expect(ids.size).toBe(0);
  });

  it("is safe in an SSR-like environment where window is undefined", () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error — deliberately removing window to simulate SSR
    delete globalThis.window;

    let ids: Set<string> | undefined;
    expect(() => {
      ids = getReadIds();
    }).not.toThrow();
    expect(ids).toBeInstanceOf(Set);
    expect(ids!.size).toBe(0);

    // Restore window so other tests are unaffected.
    globalThis.window = originalWindow;
  });
});

describe("saveReadIds", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("persists a Set of IDs to localStorage", () => {
    saveReadIds(new Set(["id-a", "id-b"]));
    const raw = localStorage.getItem("notifications.read");
    expect(raw).not.toBeNull();
    const parsed: string[] = JSON.parse(raw!);
    expect(parsed).toContain("id-a");
    expect(parsed).toContain("id-b");
    expect(parsed).toHaveLength(2);
  });

  it("persists an empty Set as an empty JSON array", () => {
    saveReadIds(new Set());
    const raw = localStorage.getItem("notifications.read");
    expect(raw).toBe("[]");
  });

  it("is safe in an SSR-like environment where window is undefined (no-op)", () => {
    const originalWindow = globalThis.window;
    // @ts-expect-error — deliberately removing window to simulate SSR
    delete globalThis.window;

    expect(() => saveReadIds(new Set(["id-1"]))).not.toThrow();
    // localStorage was not touched because the function returned early.
    globalThis.window = originalWindow;
    expect(localStorage.getItem("notifications.read")).toBeNull();
  });

  it("round-trips correctly with getReadIds", () => {
    const original = new Set(["notif-1", "notif-2", "notif-3"]);
    saveReadIds(original);
    const retrieved = getReadIds();
    expect(retrieved).toEqual(original);
  });

  it("overwrites a previous value with the new Set", () => {
    saveReadIds(new Set(["old-id"]));
    saveReadIds(new Set(["new-id-1", "new-id-2"]));
    const ids = getReadIds();
    expect(ids.has("old-id")).toBe(false);
    expect(ids.has("new-id-1")).toBe(true);
    expect(ids.has("new-id-2")).toBe(true);
  });
});
