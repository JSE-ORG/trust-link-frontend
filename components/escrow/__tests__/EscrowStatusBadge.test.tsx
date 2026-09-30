import { render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect,it } from "vitest";

import { ESCROW_STATUS_MAP, EscrowState } from "../escrow-status";
import { EscrowStatusBadge } from "../EscrowStatusBadge";

const VARIANT_CLASSES: Record<string, string> = {
  default: "bg-zinc-900",
  secondary: "bg-zinc-100",
  destructive: "bg-red-500",
  outline: "text-zinc-950",
  success: "bg-emerald-500",
  warning: "bg-amber-500",
};

const states = Object.keys(ESCROW_STATUS_MAP) as EscrowState[];

describe("EscrowStatusBadge", () => {
  it.each(states)(
    "renders %s with correct label and variant class",
    (state) => {
      const { label, variant } = ESCROW_STATUS_MAP[state];
      render(<EscrowStatusBadge status={state} />);
      const liveRegion = screen.getByRole("status");
      expect(liveRegion).toHaveAccessibleName(`Escrow status updated to: ${label}`);
      expect(liveRegion).toHaveAttribute("aria-live", "polite");
      expect(liveRegion).toHaveAttribute("aria-atomic", "true");
      expect(liveRegion.closest("div")?.className).toContain(VARIANT_CLASSES[variant as string]);
    }
  );

  it("normalizes case-insensitive status strings", () => {
    render(<EscrowStatusBadge status="pEnDiNg" />);
    expect(screen.getByRole("status")).toHaveAccessibleName("Escrow status updated to: Pending");
  });

  it("handles unknown states safely", () => {
    render(<EscrowStatusBadge status="UNKNOWN_STATE" />);
    const liveRegion = screen.getByRole("status");
    expect(liveRegion).toHaveAccessibleName("Escrow status updated to: UNKNOWN_STATE");
    expect(liveRegion.closest("div")?.className).toContain("bg-zinc-100");
  });

  it("accepts and applies custom className", () => {
    render(<EscrowStatusBadge status="Funded" className="custom-class" />);
    const badge = screen.getByRole("status");
    expect(badge.closest("div")?.className).toContain("custom-class");
    expect(badge).toHaveAccessibleName("Escrow status updated to: Funded");
  });
});
