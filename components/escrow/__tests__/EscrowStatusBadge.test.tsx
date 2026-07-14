import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EscrowStatusBadge } from "../EscrowStatusBadge";
import { ESCROW_STATUS_MAP, EscrowState } from "../escrow-status";

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
      const badge = screen.getByText(label);
      expect(badge).toBeInTheDocument();
      expect(badge.className).toContain(VARIANT_CLASSES[variant as string]);
    }
  );

  it("normalizes case-insensitive status strings", () => {
    render(<EscrowStatusBadge status="pEnDiNg" />);
    expect(screen.getByText("Pending")).toBeInTheDocument();
  });

  it("handles unknown states safely", () => {
    render(<EscrowStatusBadge status="UNKNOWN_STATE" />);
    const badge = screen.getByText("UNKNOWN_STATE");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-zinc-100");
  });

  it("accepts and applies custom className", () => {
    render(<EscrowStatusBadge status="Funded" className="custom-class" />);
    const badge = screen.getByText("Funded");
    expect(badge.className).toContain("custom-class");
  });
});
