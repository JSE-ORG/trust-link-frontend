import { act, render, screen, waitFor } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getVendorAnalytics, type VendorAnalyticsResponse } from "@/lib/api";

import DashboardAnalyticsSummary from "../DashboardAnalyticsSummary";

vi.mock("@/lib/api", () => ({
  getVendorAnalytics: vi.fn(),
}));

// Replace the Recharts chart with a stub that exposes the props it receives.
vi.mock("../VendorAnalyticsChart", () => ({
  default: ({ dataPoints, isMobile }: { dataPoints: unknown[]; isMobile: boolean }) => (
    <div data-testid="analytics-chart" data-points={dataPoints.length} data-mobile={String(isMobile)} />
  ),
}));

const mockGetVendorAnalytics = vi.mocked(getVendorAnalytics);

const TOKEN = "test-jwt";
const NO_DATA = "No analytics data available.";

const analyticsResponse: VendorAnalyticsResponse = {
  dataPoints: [
    { date: "2026-09-01", transactionVolume: 100, averageOrderValue: 50, completionRate: 0.9, disputeRate: 0.01 },
    { date: "2026-09-02", transactionVolume: 200, averageOrderValue: 60, completionRate: 0.95, disputeRate: 0 },
  ],
};

type ChangeListener = (event: MediaQueryListEvent) => void;

/** Installs a controllable `window.matchMedia` and returns helpers to drive it. */
function mockMatchMedia(initialMatches: boolean) {
  const listeners = new Set<ChangeListener>();
  const mql = {
    matches: initialMatches,
    media: "(max-width: 640px)",
    onchange: null,
    addEventListener: vi.fn((_: string, cb: ChangeListener) => listeners.add(cb)),
    removeEventListener: vi.fn((_: string, cb: ChangeListener) => listeners.delete(cb)),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  window.matchMedia = vi.fn().mockReturnValue(mql);
  return {
    mql,
    setMatches(matches: boolean) {
      mql.matches = matches;
      listeners.forEach((cb) => cb({ matches } as MediaQueryListEvent));
    },
  };
}

describe("DashboardAnalyticsSummary", () => {
  beforeEach(() => {
    mockMatchMedia(false);
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("shows a loading skeleton while analytics are being fetched", async () => {
    window.localStorage.setItem("wallet.jwt", TOKEN);
    let resolve!: (value: VendorAnalyticsResponse) => void;
    mockGetVendorAnalytics.mockReturnValue(new Promise((r) => (resolve = r)));

    const { container } = render(<DashboardAnalyticsSummary />);

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
    expect(screen.queryByText(NO_DATA)).not.toBeInTheDocument();
    expect(screen.queryByTestId("analytics-chart")).not.toBeInTheDocument();

    await act(async () => resolve(analyticsResponse));
    expect(await screen.findByTestId("analytics-chart")).toBeInTheDocument();
  });

  it("shows the empty state without calling the API when no token is stored", async () => {
    render(<DashboardAnalyticsSummary />);

    expect(await screen.findByText(NO_DATA)).toBeInTheDocument();
    expect(mockGetVendorAnalytics).not.toHaveBeenCalled();
  });

  it("fetches analytics with the stored token and renders the chart", async () => {
    window.localStorage.setItem("wallet.jwt", TOKEN);
    mockGetVendorAnalytics.mockResolvedValue(analyticsResponse);

    render(<DashboardAnalyticsSummary />);

    const chart = await screen.findByTestId("analytics-chart");
    expect(mockGetVendorAnalytics).toHaveBeenCalledTimes(1);
    expect(mockGetVendorAnalytics).toHaveBeenCalledWith(TOKEN);
    expect(chart).toHaveAttribute("data-points", "2");
    expect(chart).toHaveAttribute("data-mobile", "false");
    expect(screen.queryByText(NO_DATA)).not.toBeInTheDocument();
  });

  it("shows the empty state when the API returns no data points", async () => {
    window.localStorage.setItem("wallet.jwt", TOKEN);
    mockGetVendorAnalytics.mockResolvedValue({ dataPoints: [] });

    render(<DashboardAnalyticsSummary />);

    expect(await screen.findByText(NO_DATA)).toBeInTheDocument();
    expect(screen.queryByTestId("analytics-chart")).not.toBeInTheDocument();
  });

  it("logs the error and falls back to the empty state when the request fails", async () => {
    window.localStorage.setItem("wallet.jwt", TOKEN);
    const error = new Error("network down");
    mockGetVendorAnalytics.mockRejectedValue(error);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    render(<DashboardAnalyticsSummary />);

    expect(await screen.findByText(NO_DATA)).toBeInTheDocument();
    expect(consoleError).toHaveBeenCalledWith(error);
  });

  it("passes isMobile to the chart based on the viewport breakpoint", async () => {
    const media = mockMatchMedia(true);
    window.localStorage.setItem("wallet.jwt", TOKEN);
    mockGetVendorAnalytics.mockResolvedValue(analyticsResponse);

    render(<DashboardAnalyticsSummary />);

    const chart = await screen.findByTestId("analytics-chart");
    expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 640px)");
    expect(chart).toHaveAttribute("data-mobile", "true");

    act(() => media.setMatches(false));
    await waitFor(() => expect(screen.getByTestId("analytics-chart")).toHaveAttribute("data-mobile", "false"));
  });

  it("removes the breakpoint listener on unmount", async () => {
    const { mql } = mockMatchMedia(false);

    const { unmount } = render(<DashboardAnalyticsSummary />);
    await screen.findByText(NO_DATA);
    unmount();

    expect(mql.removeEventListener).toHaveBeenCalledWith("change", mql.addEventListener.mock.calls[0][1]);
  });

  it("does not update state after unmounting mid-request", async () => {
    window.localStorage.setItem("wallet.jwt", TOKEN);
    let resolve!: (value: VendorAnalyticsResponse) => void;
    mockGetVendorAnalytics.mockReturnValue(new Promise((r) => (resolve = r)));
    const consoleError = vi.spyOn(console, "error");

    const { unmount } = render(<DashboardAnalyticsSummary />);
    unmount();
    await act(async () => resolve(analyticsResponse));

    expect(consoleError).not.toHaveBeenCalled();
  });
});
