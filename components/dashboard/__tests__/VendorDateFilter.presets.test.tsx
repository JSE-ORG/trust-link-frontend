import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import VendorDateFilter from "../VendorDateFilter";

/**
 * Controlled harness mirroring how `VendorDashboardList` wires the filter, so
 * chip clicks and manual edits both flow through the real props contract.
 */
function Harness({
  initialFrom = "",
  initialTo = "",
}: {
  initialFrom?: string;
  initialTo?: string;
}) {
  const [fromDate, setFromDate] = useState(initialFrom);
  const [toDate, setToDate] = useState(initialTo);

  return (
    <VendorDateFilter
      fromDate={fromDate}
      toDate={toDate}
      onFromDateChange={setFromDate}
      onToDateChange={setToDate}
      onClear={() => {
        setFromDate("");
        setToDate("");
      }}
    />
  );
}

function dateInputValues() {
  const from = screen.getByLabelText("From") as HTMLInputElement;
  const to = screen.getByLabelText("To") as HTMLInputElement;
  return { from: from.value, to: to.value };
}

function presetChip(name: string) {
  return screen.getByRole("button", { name });
}

function activeChips() {
  return screen
    .getAllByRole("button")
    .filter((button) => button.getAttribute("aria-pressed") === "true");
}

// 3 March 2026, midday local — fixed so the expectations are timezone-stable.
const NOW = new Date(2026, 2, 3, 12, 0, 0);

describe("VendorDateFilter — date presets (issue #1118)", () => {
  beforeEach(() => {
    // `shouldAdvanceTime` keeps userEvent's internal delays resolvable while
    // the clock stays pinned to a fixed instant for the date assertions.
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ["Today", "2026-03-03", "2026-03-03"],
    ["Last 7 Days", "2026-02-24", "2026-03-03"],
    ["Last 30 Days", "2026-02-01", "2026-03-03"],
    ["This Month", "2026-03-01", "2026-03-03"],
  ])(
    "populates both inputs for the %s preset",
    async (label, expectedFrom, expectedTo) => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<Harness />);

      await user.click(presetChip(label));

      expect(dateInputValues()).toEqual({
        from: expectedFrom,
        to: expectedTo,
      });
      expect(presetChip(label)).toHaveAttribute("aria-pressed", "true");
    }
  );

  it("activates only the matching chip when both dates match exactly", () => {
    render(<Harness initialFrom="2026-02-24" initialTo="2026-03-03" />);

    expect(presetChip("Last 7 Days")).toHaveAttribute("aria-pressed", "true");
    expect(activeChips()).toHaveLength(1);
  });

  it("unselects every chip when only one boundary matches", () => {
    render(<Harness initialFrom="2026-02-24" initialTo="2026-03-02" />);

    expect(activeChips()).toHaveLength(0);
    expect(presetChip("Last 7 Days")).toHaveAttribute("aria-pressed", "false");
  });

  it("starts with no preset selected", () => {
    render(<Harness />);

    expect(activeChips()).toHaveLength(0);
    for (const label of ["Today", "Last 7 Days", "Last 30 Days", "This Month"]) {
      expect(presetChip(label)).toHaveAttribute("aria-pressed", "false");
    }
  });

  it("can mark Today and This Month active together on the first of the month", async () => {
    vi.setSystemTime(new Date(2026, 2, 1, 9, 0, 0)); // 1 March 2026
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Harness />);

    await user.click(presetChip("This Month"));

    // Both ranges are 1 March → 1 March on this day, so both are genuinely active.
    expect(dateInputValues()).toEqual({
      from: "2026-03-01",
      to: "2026-03-01",
    });
    expect(presetChip("This Month")).toHaveAttribute("aria-pressed", "true");
    expect(presetChip("Today")).toHaveAttribute("aria-pressed", "true");
    expect(presetChip("Last 7 Days")).toHaveAttribute("aria-pressed", "false");
    expect(presetChip("Last 30 Days")).toHaveAttribute("aria-pressed", "false");
    expect(activeChips()).toHaveLength(2);
  });

  it("never formats preset dates through toISOString", async () => {
    const toISOStringSpy = vi.spyOn(Date.prototype, "toISOString");

    try {
      vi.setSystemTime(new Date(2026, 2, 1, 0, 30, 0)); // concurrency boundary
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<Harness />);

      await user.click(presetChip("Last 7 Days"));
      await user.click(presetChip("This Month"));
      await user.click(presetChip("Today"));

      // Local calendar fields only — UTC formatting would shift the day.
      expect(toISOStringSpy).not.toHaveBeenCalled();
    } finally {
      toISOStringSpy.mockRestore();
    }
  });

  it("unselects the active preset when a date is edited manually", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Harness initialFrom="2026-03-03" initialTo="2026-03-03" />);

    expect(presetChip("Today")).toHaveAttribute("aria-pressed", "true");

    const fromInput = screen.getByLabelText("From");
    await user.clear(fromInput);
    await user.type(fromInput, "2026-03-02");

    expect(activeChips()).toHaveLength(0);
    expect(dateInputValues().to).toBe("2026-03-03");
  });

  it("clears both dates and the active preset", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Harness />);

    await user.click(presetChip("Last 30 Days"));
    expect(activeChips()).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Clear dates" }));

    expect(dateInputValues()).toEqual({ from: "", to: "" });
    expect(activeChips()).toHaveLength(0);
    // The clear affordance only exists while a date filter is set.
    expect(
      screen.queryByRole("button", { name: "Clear dates" })
    ).not.toBeInTheDocument();
  });

  it("activates presets from the keyboard (Enter and Space)", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Harness />);

    presetChip("Last 30 Days").focus();
    await user.keyboard("{Enter}");
    expect(dateInputValues()).toEqual({
      from: "2026-02-01",
      to: "2026-03-03",
    });
    expect(presetChip("Last 30 Days")).toHaveAttribute("aria-pressed", "true");

    presetChip("Today").focus();
    await user.keyboard(" ");
    expect(dateInputValues()).toEqual({
      from: "2026-03-03",
      to: "2026-03-03",
    });
    expect(presetChip("Today")).toHaveAttribute("aria-pressed", "true");
    expect(presetChip("Last 30 Days")).toHaveAttribute("aria-pressed", "false");
  });

  it("keeps local calendar days across a month boundary", async () => {
    vi.setSystemTime(new Date(2026, 2, 1, 0, 30, 0)); // 1 March 2026, just after midnight
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Harness />);

    await user.click(presetChip("Last 7 Days"));
    expect(dateInputValues()).toEqual({
      from: "2026-02-22",
      to: "2026-03-01",
    });

    await user.click(presetChip("This Month"));
    expect(dateInputValues()).toEqual({
      from: "2026-03-01",
      to: "2026-03-01",
    });
  });

  it("keeps local calendar days across a year boundary", async () => {
    vi.setSystemTime(new Date(2027, 0, 2, 0, 30, 0)); // 2 January 2027, just after midnight
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(<Harness />);

    await user.click(presetChip("Last 7 Days"));
    expect(dateInputValues()).toEqual({
      from: "2026-12-26",
      to: "2027-01-02",
    });

    await user.click(presetChip("This Month"));
    expect(dateInputValues()).toEqual({
      from: "2027-01-01",
      to: "2027-01-02",
    });
  });

  it("exposes accessible button semantics and focus styling", () => {
    render(<Harness />);

    for (const label of ["Today", "Last 7 Days", "Last 30 Days", "This Month"]) {
      const chip = presetChip(label);
      expect(chip).toHaveAttribute("type", "button");
      expect(chip).toHaveAttribute("aria-pressed");
      expect(chip.className).toContain("focus-visible:ring-2");
      expect(chip.className).toContain("focus-visible:ring-offset-2");
    }

    // Chips live in a wrapping row so they reflow on narrow viewports.
    const chipRow = presetChip("Today").parentElement;
    expect(chipRow?.className).toContain("flex-wrap");
  });

  it("renders the localized English labels from the translation files", () => {
    render(<Harness />);

    for (const label of ["Today", "Last 7 Days", "Last 30 Days", "This Month"]) {
      expect(presetChip(label)).toBeInTheDocument();
    }
  });
});
