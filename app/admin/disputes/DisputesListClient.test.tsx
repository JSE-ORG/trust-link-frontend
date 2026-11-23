import { fireEvent, render, screen } from "@testing-library/react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getAdminDisputes } from "@/lib/api";
import { Dispute, DisputeStatusConst } from "@/types";
import { exportToCsv } from "@/utils/exportCsv";

import { DisputesListClient, formatDisputeForCsv } from "./DisputesListClient";

const mockPush = vi.fn();
const mockReplace = vi.fn();
let currentSearchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  usePathname: () => "/admin/disputes",
  useSearchParams: () => currentSearchParams,
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    i18n: { language: "en" },
    t: (key: string) => key,
  }),
}));

vi.mock("@/lib/api", () => ({
  getAdminDisputes: vi.fn(),
}));

vi.mock("@/utils/exportCsv", () => ({
  exportToCsv: vi.fn(),
  downloadCsv: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockDisputes: Dispute[] = [
  {
    id: "dispute-1",
    escrowId: "escrow-1",
    escrow: {
      id: "escrow-1",
      item: "Laptop Stand",
      amount: 150,
      buyerId: "buyer1",
      vendorId: "vendor1",
      status: "DISPUTED",
      createdAt: "2026-09-01T00:00:00Z",
      updatedAt: "2026-09-01T00:00:00Z",
      history: [],
    },
    buyerId: "buyer1",
    reason: "Damaged item",
    evidence: ["https://example.com/photo.jpg"],
    status: DisputeStatusConst.OPEN,
    createdAt: "2026-09-01T10:00:00Z",
    updatedAt: "2026-09-01T10:00:00Z",
  },
  {
    id: "dispute-2",
    escrowId: "escrow-2",
    escrow: {
      id: "escrow-2",
      item: "Mechanical Keyboard",
      amount: 250,
      buyerId: "buyer2",
      vendorId: "vendor2",
      status: "DISPUTED",
      createdAt: "2026-09-02T00:00:00Z",
      updatedAt: "2026-09-02T00:00:00Z",
      history: [],
    },
    buyerId: "buyer2",
    reason: "Wrong item sent",
    evidence: [],
    status: DisputeStatusConst.UNDER_REVIEW,
    createdAt: "2026-09-02T10:00:00Z",
    updatedAt: "2026-09-02T10:00:00Z",
  },
  {
    id: "dispute-3",
    escrowId: "escrow-3",
    escrow: {
      id: "escrow-3",
      item: "Wireless Mouse",
      amount: 80,
      buyerId: "buyer3",
      vendorId: "vendor3",
      status: "RELEASED",
      createdAt: "2026-09-03T00:00:00Z",
      updatedAt: "2026-09-03T00:00:00Z",
      history: [],
    },
    buyerId: "buyer3",
    reason: "Resolved issue",
    evidence: [],
    status: DisputeStatusConst.RESOLVED,
    createdAt: "2026-09-03T10:00:00Z",
    updatedAt: "2026-09-03T10:00:00Z",
  },
];

describe("DisputesListClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    window.localStorage.setItem("wallet.jwt", "valid-token");
    currentSearchParams = new URLSearchParams();
    vi.mocked(getAdminDisputes).mockResolvedValue(mockDisputes);
  });

  it("renders all disputes by default and displays correct badge counts", async () => {
    render(<DisputesListClient />);

    expect(await screen.findByText("Laptop Stand")).toBeInTheDocument();
    expect(screen.getByText("Mechanical Keyboard")).toBeInTheDocument();
    expect(screen.getByText("Wireless Mouse")).toBeInTheDocument();

    const allTab = screen.getByRole("tab", { name: /all/i });
    const openTab = screen.getByRole("tab", { name: /open \/ investigating/i });
    const resolvedTab = screen.getByRole("tab", { name: /resolved/i });

    expect(allTab).toHaveAttribute("aria-selected", "true");
    expect(openTab).toHaveAttribute("aria-selected", "false");
    expect(resolvedTab).toHaveAttribute("aria-selected", "false");

    expect(allTab).toHaveTextContent("3");
    expect(openTab).toHaveTextContent("2");
    expect(resolvedTab).toHaveTextContent("1");
  });

  it("filters to only open/investigating disputes when Open tab is clicked", async () => {
    render(<DisputesListClient />);

    await screen.findByText("Laptop Stand");

    const openTab = screen.getByRole("tab", { name: /open \/ investigating/i });
    fireEvent.click(openTab);

    expect(openTab).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Laptop Stand")).toBeInTheDocument();
    expect(screen.getByText("Mechanical Keyboard")).toBeInTheDocument();
    expect(screen.queryByText("Wireless Mouse")).not.toBeInTheDocument();

    expect(mockReplace).toHaveBeenCalledWith("/admin/disputes?status=open", { scroll: false });
  });

  it("filters to only resolved disputes when Resolved tab is clicked", async () => {
    render(<DisputesListClient />);

    await screen.findByText("Laptop Stand");

    const resolvedTab = screen.getByRole("tab", { name: /resolved/i });
    fireEvent.click(resolvedTab);

    expect(resolvedTab).toHaveAttribute("aria-selected", "true");
    expect(screen.queryByText("Laptop Stand")).not.toBeInTheDocument();
    expect(screen.queryByText("Mechanical Keyboard")).not.toBeInTheDocument();
    expect(screen.getByText("Wireless Mouse")).toBeInTheDocument();

    expect(mockReplace).toHaveBeenCalledWith("/admin/disputes?status=resolved", { scroll: false });
  });

  it("initializes filter from URL search parameters", async () => {
    currentSearchParams = new URLSearchParams("status=resolved");

    render(<DisputesListClient />);

    await screen.findByText("Wireless Mouse");
    expect(screen.queryByText("Laptop Stand")).not.toBeInTheDocument();

    const resolvedTab = screen.getByRole("tab", { name: /resolved/i });
    expect(resolvedTab).toHaveAttribute("aria-selected", "true");
  });

  it("supports keyboard arrow navigation between tabs", async () => {
    render(<DisputesListClient />);

    await screen.findByText("Laptop Stand");

    const allTab = screen.getByRole("tab", { name: /all/i });
    allTab.focus();

    // ArrowRight moves to Open tab
    fireEvent.keyDown(allTab, { key: "ArrowRight" });
    const openTab = screen.getByRole("tab", { name: /open \/ investigating/i });
    expect(openTab).toHaveAttribute("aria-selected", "true");
    expect(mockReplace).toHaveBeenCalledWith("/admin/disputes?status=open", { scroll: false });

    // ArrowRight moves to Resolved tab
    fireEvent.keyDown(openTab, { key: "ArrowRight" });
    const resolvedTab = screen.getByRole("tab", { name: /resolved/i });
    expect(resolvedTab).toHaveAttribute("aria-selected", "true");
    expect(mockReplace).toHaveBeenCalledWith("/admin/disputes?status=resolved", { scroll: false });

    // ArrowRight wraps back to All tab
    fireEvent.keyDown(resolvedTab, { key: "ArrowRight" });
    expect(allTab).toHaveAttribute("aria-selected", "true");
  });

  it("shows empty state message when no disputes match selected filter", async () => {
    const onlyOpenDisputes = mockDisputes.filter((d) => d.status !== DisputeStatusConst.RESOLVED);
    vi.mocked(getAdminDisputes).mockResolvedValue(onlyOpenDisputes);

    render(<DisputesListClient />);

    await screen.findByText("Laptop Stand");

    const resolvedTab = screen.getByRole("tab", { name: /resolved/i });
    fireEvent.click(resolvedTab);

    expect(screen.getByText("No resolved disputes right now.")).toBeInTheDocument();
  });

  it("exports dispute logs to CSV with sanitized cells and triggers toast", async () => {
    const exportToCsvMock = vi.mocked(exportToCsv);
    exportToCsvMock.mockClear();
    vi.mocked(toast.success).mockClear();

    render(<DisputesListClient />);

    await screen.findByText("Laptop Stand");

    const exportBtn = screen.getByRole("button", { name: /export disputes/i });
    expect(exportBtn).toBeEnabled();

    fireEvent.click(exportBtn);

    expect(exportToCsvMock).toHaveBeenCalledTimes(1);
    const [rows, columns, filename] = exportToCsvMock.mock.calls[0];

    expect(filename).toMatch(/^trustlink-disputes-\d{4}-\d{2}-\d{2}\.csv$/);
    expect(columns.map((c) => c.header)).toEqual([
      "Dispute ID",
      "Escrow ID",
      "Item",
      "Amount (USDC)",
      "Buyer Address",
      "Vendor Address",
      "Reason",
      "Created Date",
      "Status",
    ]);

    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({
      disputeId: "dispute-3", // sorted by date descending: dispute-3 is 2026-09-03
      item: "Wireless Mouse",
    });

    expect(toast.success).toHaveBeenCalledWith("Dispute logs exported successfully.");
  });

  it("neutralizes spreadsheet formula injection in dispute records", () => {
    const maliciousDispute: Dispute = {
      id: "=CMD('calc')",
      escrowId: "+12345",
      escrow: {
        id: "+12345",
        item: "@danger",
        amount: 100,
        buyerId: "-buyer",
        vendorId: "\tvendor",
        status: "DISPUTED",
        createdAt: "2026-09-01T00:00:00Z",
        updatedAt: "2026-09-01T00:00:00Z",
        history: [],
      },
      buyerId: "-buyer",
      reason: "=1+1",
      evidence: [],
      status: DisputeStatusConst.OPEN,
      createdAt: "2026-09-01T10:00:00Z",
      updatedAt: "2026-09-01T10:00:00Z",
    };

    const row = formatDisputeForCsv(maliciousDispute);
    expect(row.disputeId).toBe("'=CMD('calc')");
    expect(row.escrowId).toBe("'+12345");
    expect(row.item).toBe("'@danger");
    expect(row.buyerAddress).toBe("'-buyer");
    expect(row.vendorAddress).toBe("'\tvendor");
    expect(row.reason).toBe("'=1+1");
  });

  it("disables export button when there are no disputes", async () => {
    vi.mocked(getAdminDisputes).mockResolvedValue([]);
    render(<DisputesListClient />);

    await screen.findByText("No disputes right now.");

    const exportBtn = screen.getByRole("button", { name: /export disputes/i });
    expect(exportBtn).toBeDisabled();
  });
});
