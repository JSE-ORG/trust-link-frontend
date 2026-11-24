import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Pagination from "@/components/ui/Pagination";
import type { Escrow } from "@/types";

import { useEscrowFilters } from "../useEscrowFilters";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: "en" },
  }),
}));

function makeEscrows(count: number): Escrow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `e${i + 1}`,
    item: `Item ${i + 1}`,
    amount: 100,
    status: "PENDING",
    createdAt: new Date(2026, 0, 1).toISOString(),
  })) as unknown as Escrow[];
}

function Harness({ escrows }: { escrows: Escrow[] | null }) {
  const filters = useEscrowFilters(escrows);
  return (
    <div>
      <p data-testid="page">{filters.currentPage}</p>
      <ul>
        {filters.paginatedEscrows.map((e) => (
          <li key={e.id}>{e.item}</li>
        ))}
      </ul>
      <Pagination
        currentPage={filters.currentPage}
        totalPages={filters.totalPages}
        onPageChange={filters.goToPage}
      />
    </div>
  );
}

const rows = () => screen.queryAllByRole("listitem").map((li) => li.textContent);
const next = () => screen.getByRole("button", { name: "dashboard.next" });
const previous = () => screen.getByRole("button", { name: "dashboard.previous" });

describe("useEscrowFilters pagination clamping", () => {
  it("reveals the preceding page when the last item on a later page is removed", () => {
    const initial = makeEscrows(11);
    const { rerender } = render(<Harness escrows={initial} />);

    act(() => fireEvent.click(next()));
    expect(screen.getByTestId("page")).toHaveTextContent("2");
    expect(rows()).toEqual(["Item 11"]);

    // Simulate cancelling the only escrow on page two.
    rerender(<Harness escrows={initial.slice(0, 10)} />);

    expect(screen.getByTestId("page")).toHaveTextContent("1");
    expect(rows()).toHaveLength(10);
    expect(rows()[0]).toBe("Item 1");
    expect(next()).toBeDisabled();
    expect(previous()).toBeDisabled();
  });

  it("keeps a valid page when data is replaced with a smaller list", () => {
    const { rerender } = render(<Harness escrows={makeEscrows(35)} />);

    act(() => fireEvent.click(next()));
    act(() => fireEvent.click(next()));
    act(() => fireEvent.click(next()));
    expect(screen.getByTestId("page")).toHaveTextContent("4");

    // Reload returns fewer results: 25 items => 3 pages.
    rerender(<Harness escrows={makeEscrows(25)} />);

    expect(screen.getByTestId("page")).toHaveTextContent("3");
    expect(rows()).toEqual(["Item 21", "Item 22", "Item 23", "Item 24", "Item 25"]);
    expect(screen.getByText(/dashboard.showingPage/).textContent).toContain("3");
    expect(next()).toBeDisabled();

    // Navigation keeps working from the clamped page.
    act(() => fireEvent.click(previous()));
    expect(screen.getByTestId("page")).toHaveTextContent("2");
    expect(rows()[0]).toBe("Item 11");
  });

  it("never produces page zero for empty results", () => {
    const { rerender } = render(<Harness escrows={makeEscrows(15)} />);
    act(() => fireEvent.click(next()));

    rerender(<Harness escrows={[]} />);

    expect(screen.getByTestId("page")).toHaveTextContent("1");
    expect(rows()).toEqual([]);
    expect(previous()).toBeDisabled();
    expect(next()).toBeDisabled();

    // Stepping forward on an empty list must not drop to page zero.
    act(() => fireEvent.click(next()));
    expect(screen.getByTestId("page")).toHaveTextContent("1");

    rerender(<Harness escrows={null} />);
    expect(screen.getByTestId("page")).toHaveTextContent("1");
  });
});
