import { renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { SWRConfig } from "swr";
import { afterEach, beforeEach,describe, expect, it, vi } from "vitest";

import * as api from "@/lib/api";
import { Tracking } from "@/types";

import { useTracking } from "../useTracking";

vi.mock("@/lib/api", () => ({
  getTracking: vi.fn(),
}));

const mockTracking: Tracking = {
  escrowId: "esc_123",
  status: "in_transit",
  carrier: "FedEx",
  trackingNumber: "FX123456789",
  estimatedDelivery: "2026-09-01T12:00:00Z",
  events: [
    {
      id: "evt_1",
      status: "in_transit",
      location: "New York, NY",
      timestamp: "2026-08-25T10:00:00Z",
      description: "Package in transit",
    },
  ],
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
    {children}
  </SWRConfig>
);

describe("useTracking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should have isLoading: true on mount and false after success", async () => {
    vi.mocked(api.getTracking).mockResolvedValue(mockTracking);

    const { result } = renderHook(() => useTracking("esc_123"), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockTracking);
    expect(result.current.error).toBeNull();
  });

  it("should return status and estimatedDelivery from data", async () => {
    vi.mocked(api.getTracking).mockResolvedValue(mockTracking);

    const { result } = renderHook(() => useTracking("esc_123"), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.status).toBe("in_transit");
    expect(result.current.estimatedDelivery).toBe("2026-09-01T12:00:00Z");
  });

  it("should return null status and estimatedDelivery when no data", async () => {
    vi.mocked(api.getTracking).mockResolvedValue(mockTracking);

    const { result } = renderHook(() => useTracking(null), { wrapper });

    expect(result.current.data).toBeNull();
    expect(result.current.status).toBeNull();
    expect(result.current.estimatedDelivery).toBeNull();
  });

  it("should handle error state when API fails", async () => {
    const error = new Error("Network error");
    vi.mocked(api.getTracking).mockRejectedValue(error);

    const { result } = renderHook(() => useTracking("esc_123"), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeNull();
  });

  it("should not fetch when escrowId is null", async () => {
    const { result } = renderHook(() => useTracking(null), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(api.getTracking).not.toHaveBeenCalled();
  });

  it("should not fetch when escrowId is undefined", async () => {
    const { result } = renderHook(() => useTracking(undefined), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(api.getTracking).not.toHaveBeenCalled();
  });

  it("should stop polling when status is delivered", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const deliveredTracking: Tracking = {
      ...mockTracking,
      status: "delivered",
    };
    vi.mocked(api.getTracking).mockResolvedValue(deliveredTracking);

    const { result } = renderHook(() => useTracking("esc_123"), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(api.getTracking).toHaveBeenCalledTimes(1);

    // Advance past the polling interval — should not re-fetch
    await vi.advanceTimersByTimeAsync(35000);

    expect(api.getTracking).toHaveBeenCalledTimes(1);
  });

  it("should stop polling when status is disputed", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const disputedTracking: Tracking = {
      ...mockTracking,
      status: "disputed",
    };
    vi.mocked(api.getTracking).mockResolvedValue(disputedTracking);

    const { result } = renderHook(() => useTracking("esc_123"), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await vi.advanceTimersByTimeAsync(35000);

    expect(api.getTracking).toHaveBeenCalledTimes(1);
  });

  it("should stop polling when status is completed", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const completedTracking: Tracking = {
      ...mockTracking,
      status: "completed",
    };
    vi.mocked(api.getTracking).mockResolvedValue(completedTracking);

    const { result } = renderHook(() => useTracking("esc_123"), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await vi.advanceTimersByTimeAsync(35000);

    expect(api.getTracking).toHaveBeenCalledTimes(1);
  });

  it("should continue polling when status is active", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(api.getTracking).mockResolvedValue(mockTracking);

    const { result } = renderHook(() => useTracking("esc_123"), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(api.getTracking).toHaveBeenCalledTimes(1);

    // Advance past one polling interval
    await vi.advanceTimersByTimeAsync(35000);

    await waitFor(() => {
      expect(api.getTracking).toHaveBeenCalledTimes(2);
    }, { timeout: 5000 });
  });

  it("should provide a refetch function", async () => {
    vi.mocked(api.getTracking).mockResolvedValue(mockTracking);

    const { result } = renderHook(() => useTracking("esc_123"), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(typeof result.current.refetch).toBe("function");
  });
});
