import { render, screen } from "@testing-library/react";
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

  it("renders correctly with empty data points", () => {
    const { container } = render(
      <VendorAnalyticsChart dataPoints={[]} isMobile={false} />
    );
    expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    expect(container.querySelector(".recharts-wrapper")).toBeInTheDocument();
  });
});
