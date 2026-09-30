import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { afterEach, beforeEach, describe, expect, it, type Mock,vi } from "vitest";

import { getVendorAnalytics, type VendorAnalyticsResponse } from "@/lib/api";

import VendorAnalyticsSection from "../VendorAnalyticsSection";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("react-i18next", () => ({
  useTranslation: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  getVendorAnalytics: vi.fn(),
}));

vi.mock("../VendorAnalyticsChart", () => ({
  default: ({ dataPoints, isMobile }: { dataPoints: unknown[]; isMobile: boolean }) => (
    <div data-testid="analytics-chart" data-points={dataPoints.length} data-mobile={String(isMobile)} />
  ),
}));

vi.mock("../VendorAnalyticsSkeleton", () => ({
  default: () => <div data-testid="analytics-skeleton" />,
}));

const mockGetVendorAnalytics = vi.mocked(getVendorAnalytics);
const mockUseRouter = vi.mocked(useRouter);
const mockUseTranslation = vi.mocked(useTranslation);

const TOKEN = "test-jwt";

const analyticsResponse: VendorAnalyticsResponse = {
  totalTransactionVolume: 300,
  averageOrderValue: 55,
  completionRate: 0.92,
  disputeRate: 0.01,
  dataPoints: [
    { date: "2026-09-01", transactionVolume: 100, averageOrderValue: 50, completionRate: 0.9, disputeRate: 0.01 },
    { date: "2026-09-02", transactionVolume: 200, averageOrderValue: 60, completionRate: 0.95, disputeRate: 0 },
  ],
};

type ChangeListener = (event: MediaQueryListEvent) => void;

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

describe("VendorAnalyticsSection", () => {
  let mockRouterPush: Mock;

  beforeEach(() => {
    mockMatchMedia(false);
    window.localStorage.clear();
    mockUseTranslation.mockReturnValue({
      t: (key: string) => key,
    } as unknown as ReturnType<typeof useTranslation>);
    mockRouterPush = vi.fn();
    mockUseRouter.mockReturnValue({ push: mockRouterPush } as unknown as ReturnType<typeof useRouter>);
    
    // Mock window.location.reload
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { reload: vi.fn() },
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("redirects to home if no token is found", async () => {
    render(<VendorAnalyticsSection />);
    expect(mockRouterPush).toHaveBeenCalledWith("/");
    expect(mockGetVendorAnalytics).not.toHaveBeenCalled();
  });

  it("shows a skeleton while loading", async () => {
    window.localStorage.setItem("wallet.jwt", TOKEN);
    let resolve!: (value: VendorAnalyticsResponse) => void;
    mockGetVendorAnalytics.mockReturnValue(new Promise((r) => (resolve = r)));

    render(<VendorAnalyticsSection />);
    expect(screen.getByTestId("analytics-skeleton")).toBeInTheDocument();

    await act(async () => resolve(analyticsResponse));
    expect(screen.queryByTestId("analytics-skeleton")).not.toBeInTheDocument();
  });

  it("fetches analytics and renders successfully", async () => {
    window.localStorage.setItem("wallet.jwt", TOKEN);
    mockGetVendorAnalytics.mockResolvedValue(analyticsResponse);

    render(<VendorAnalyticsSection />);
    
    const chart = await screen.findByTestId("analytics-chart");
    expect(mockGetVendorAnalytics).toHaveBeenCalledWith(TOKEN);
    expect(chart).toHaveAttribute("data-points", "2");
    expect(chart).toHaveAttribute("data-mobile", "false");
  });

  it("shows error state on failure and allows retry", async () => {
    window.localStorage.setItem("wallet.jwt", TOKEN);
    mockGetVendorAnalytics.mockRejectedValue(new Error("API Error"));

    render(<VendorAnalyticsSection />);
    
    expect(await screen.findByText("API Error")).toBeInTheDocument();
    
    const retryButton = screen.getByText("dashboard.analyticsPage.retry");
    fireEvent.click(retryButton);
    expect(window.location.reload).toHaveBeenCalled();
  });

  it("shows fallback text when error has no message", async () => {
    window.localStorage.setItem("wallet.jwt", TOKEN);
    mockGetVendorAnalytics.mockRejectedValue("Not an error object");

    render(<VendorAnalyticsSection />);
    expect(await screen.findByText("dashboard.analyticsPage.loadError")).toBeInTheDocument();
  });

  it("shows no points message if chart data is empty", async () => {
    window.localStorage.setItem("wallet.jwt", TOKEN);
    mockGetVendorAnalytics.mockResolvedValue({
      ...analyticsResponse,
      dataPoints: [],
    });

    render(<VendorAnalyticsSection />);
    expect(await screen.findByText("dashboard.analyticsPage.noPoints")).toBeInTheDocument();
  });

  it("passes isMobile true when window is narrow", async () => {
    const media = mockMatchMedia(true);
    window.localStorage.setItem("wallet.jwt", TOKEN);
    mockGetVendorAnalytics.mockResolvedValue(analyticsResponse);

    render(<VendorAnalyticsSection />);
    const chart = await screen.findByTestId("analytics-chart");
    expect(chart).toHaveAttribute("data-mobile", "true");

    act(() => media.setMatches(false));
    await waitFor(() => expect(screen.getByTestId("analytics-chart")).toHaveAttribute("data-mobile", "false"));
  });

  it("cleans up resize listener on unmount", async () => {
    const { mql } = mockMatchMedia(false);
    const { unmount } = render(<VendorAnalyticsSection />);
    unmount();
    expect(mql.removeEventListener).toHaveBeenCalled();
  });
});
