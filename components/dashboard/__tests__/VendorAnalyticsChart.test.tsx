import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

import VendorAnalyticsChart from "../VendorAnalyticsChart";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => {
      if (options) {
        return `${key} ${JSON.stringify(options)}`;
      }
      return key;
    },
    i18n: { language: "en" },
  }),
}));

vi.mock("@/components/providers/CurrencyProvider", () => ({
  useCurrency: () => ({
    formatAmount: (amount: number) => `$${amount}`,
  }),
}));

vi.mock("recharts", async (importOriginal) => {
  const OriginalRecharts = await importOriginal<typeof import("recharts")>();
  return {
    ...OriginalRecharts,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: 800, height: 400 }}>
        {children}
      </div>
    ),
  };
});

const mockDataPoints = [
  {
    date: "2026-09-01",
    transactionVolume: 1500,
    averageOrderValue: 75,
    completionRate: 0.95,
    disputeRate: 0.01,
  },
  {
    date: "2026-09-02",
    transactionVolume: 2000,
    averageOrderValue: 80,
    completionRate: 0.98,
    disputeRate: 0.02,
  },
];

describe("VendorAnalyticsChart", () => {
  it("renders chart correctly with data points", () => {
    const { container } = render(
      <VendorAnalyticsChart dataPoints={mockDataPoints} isMobile={false} />
    );
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(container.querySelector(".recharts-wrapper")).toBeInTheDocument();
  });

  it("applies mobile configuration when isMobile is true", () => {
    const { container } = render(
      <VendorAnalyticsChart dataPoints={mockDataPoints} isMobile={true} />
    );
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(container.querySelector(".recharts-wrapper")).toBeInTheDocument();
  });

  it("renders empty state when data points array is empty", () => {
    render(<VendorAnalyticsChart dataPoints={[]} isMobile={false} />);
    expect(screen.queryByTestId("responsive-container")).not.toBeInTheDocument();
    expect(screen.getByTestId("analytics-empty-chart")).toBeInTheDocument();
    expect(screen.getByText("dashboard.analyticsPage.emptyChart.title")).toBeInTheDocument();
    expect(screen.getByText("dashboard.analyticsPage.emptyChart.description")).toBeInTheDocument();
    const createBtn = screen.getByRole("link", { name: "dashboard.analyticsPage.emptyChart.createButton" });
    expect(createBtn).toBeInTheDocument();
    expect(createBtn).toHaveAttribute("href", "/create");
  });

  it("renders empty state when all data points have zero transaction volume", () => {
    const zeroVolumeData = [
      { date: "2026-09-01", transactionVolume: 0, averageOrderValue: 0, completionRate: 0, disputeRate: 0 },
      { date: "2026-09-02", transactionVolume: 0, averageOrderValue: 0, completionRate: 0, disputeRate: 0 },
    ];
    render(<VendorAnalyticsChart dataPoints={zeroVolumeData} isMobile={false} />);
    expect(screen.queryByTestId("responsive-container")).not.toBeInTheDocument();
    expect(screen.getByTestId("analytics-empty-chart")).toBeInTheDocument();
    expect(screen.getByText("dashboard.analyticsPage.emptyChart.title")).toBeInTheDocument();
  });

  it("renders an accessible data table with metrics and localized values when data points exist", () => {
    render(<VendorAnalyticsChart dataPoints={mockDataPoints} isMobile={false} />);

    const table = screen.getByRole("table", { hidden: true });
    expect(table).toBeInTheDocument();

    expect(screen.getByText(/dashboard.analyticsPage.date/i)).toBeInTheDocument();
    expect(screen.getByText(/dashboard.analyticsPage.totalTransactionVolume/i)).toBeInTheDocument();
    expect(screen.getByText(/dashboard.analyticsPage.averageOrderValue/i)).toBeInTheDocument();
    expect(screen.getByText(/dashboard.analyticsPage.completionRate/i)).toBeInTheDocument();
    expect(screen.getByText(/dashboard.analyticsPage.disputeRate/i)).toBeInTheDocument();

    expect(screen.getByText("$1500")).toBeInTheDocument();
    expect(screen.getByText("$2000")).toBeInTheDocument();
    expect(screen.getByText("95.0%")).toBeInTheDocument();
    expect(screen.getByText("1.0%")).toBeInTheDocument();
  });

  it("toggles between chart view and visible data table view on button click", () => {
    render(<VendorAnalyticsChart dataPoints={mockDataPoints} isMobile={false} />);

    const toggleBtn = screen.getByRole("button", { name: /dashboard.analyticsPage.viewDataTable/i });
    expect(toggleBtn).toBeInTheDocument();

    fireEvent.click(toggleBtn);

    expect(screen.getByRole("region", { name: /dashboard.analyticsPage.dataTableCaption/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /dashboard.analyticsPage.viewChart/i })).toBeInTheDocument();
  });
});
