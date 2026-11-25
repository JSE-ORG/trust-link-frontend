import { Package } from "lucide-react";
import { describe, expect, it } from "vitest";

import { EscrowStatus } from "@/types/status";

import {
  DEFAULT_STATUS_PRESENTATION,
  ESCROW_STATUS_PRESENTATION,
  getEscrowStatusPresentation,
  STATUS_BG,
  STATUS_COLORS,
} from "../escrow-status";

const allStatuses: EscrowStatus[] = [
  EscrowStatus.PENDING,
  EscrowStatus.FUNDED,
  EscrowStatus.SHIPPED,
  EscrowStatus.COMPLETED,
  EscrowStatus.DISPUTED,
  EscrowStatus.RELEASED,
  EscrowStatus.REFUNDED,
  EscrowStatus.EXPIRED,
];

describe("escrow-status presentation metadata", () => {
  it("provides explicit shared presentation entries for every EscrowStatus", () => {
    for (const status of allStatuses) {
      const entry = ESCROW_STATUS_PRESENTATION[status];
      expect(entry, `Missing entry for status ${status}`).toBeDefined();
      expect(entry.label).toBeTruthy();
      expect(entry.notificationLabel).toBeTruthy();
      expect(entry.icon).toBeDefined();
      expect(entry.badgeVariant).toBeTruthy();
      expect(entry.textColor).toContain("text-");
      expect(entry.bgClass).toBeTruthy();
    }
  });

  it("resolves status presentation case-insensitively via getEscrowStatusPresentation", () => {
    expect(getEscrowStatusPresentation("pending").label).toBe("Pending");
    expect(getEscrowStatusPresentation("FUNDED").label).toBe("Funded");
    expect(getEscrowStatusPresentation("sHiPpEd").label).toBe("Shipped");
    expect(getEscrowStatusPresentation("Completed").badgeVariant).toBe("success");
  });

  it("safely falls back for unknown, null, or undefined status values", () => {
    const unknown = getEscrowStatusPresentation("NON_EXISTENT_STATUS");
    expect(unknown.icon).toBe(Package);
    expect(unknown.badgeVariant).toBe("secondary");
    expect(unknown.label).toBe("NON_EXISTENT_STATUS");

    const nullValue = getEscrowStatusPresentation(null);
    expect(nullValue.icon).toBe(DEFAULT_STATUS_PRESENTATION.icon);
    expect(nullValue.badgeVariant).toBe(DEFAULT_STATUS_PRESENTATION.badgeVariant);

    const undefinedValue = getEscrowStatusPresentation(undefined);
    expect(undefinedValue.icon).toBe(DEFAULT_STATUS_PRESENTATION.icon);
  });

  it("maintains synchronized STATUS_COLORS and STATUS_BG tokens for notifications", () => {
    for (const status of allStatuses) {
      expect(STATUS_COLORS[status]).toBe(ESCROW_STATUS_PRESENTATION[status].textColor);
      expect(STATUS_BG[status]).toBe(ESCROW_STATUS_PRESENTATION[status].bgClass);
    }
  });
});
