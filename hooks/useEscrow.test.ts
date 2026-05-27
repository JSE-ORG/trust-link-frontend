import { renderHook, waitFor, act } from "@testing-library/react";
import { useEscrow } from "./useEscrow";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as api from "@/lib/api";
import { Escrow } from "@/types";

vi.mock("@/lib/api", () => ({
  getEscrow: vi.fn(),
}));

const mockEscrow: Escrow = {
  id: "escrow-1",
  vendorId: "vendor-1",
  amount: 100,
  item: "Test Item",
  status: "FUNDED",
  createdAt: "2023-01-01T00:00:00Z",
  updatedAt: "2023-01-01T00:00:00Z",
  history: [],
};

describe("useEscrow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have isLoading: true on mount and false after success", async () => {
    vi.mocked(api.getEscrow).mockResolvedValue(mockEscrow);

    const { result } = renderHook(() => useEscrow("escrow-1"));

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 2000 });

    expect(result.current.data).toEqual(mockEscrow);
    expect(result.current.error).toBe(null);
  });

  it("should handle error state when API returns 404 or fails", async () => {
    const error = new Error("Not Found");
    vi.mocked(api.getEscrow).mockRejectedValue(error);

    const { result } = renderHook(() => useEscrow("escrow-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    }, { timeout: 2000 });

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBe(null);
  });

  it("should update data on refetch", async () => {
    vi.mocked(api.getEscrow).mockResolvedValue(mockEscrow);

    const { result } = renderHook(() => useEscrow("escrow-1"));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updatedEscrow = { ...mockEscrow, status: "COMPLETED" as const };
    vi.mocked(api.getEscrow).mockResolvedValue(updatedEscrow);

    await act(async () => {
      result.current.refetch();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data?.status).toBe("COMPLETED");
  });

  it("should poll for data at specified interval", async () => {
    vi.useFakeTimers();
    vi.mocked(api.getEscrow).mockResolvedValue(mockEscrow);

    renderHook(() => useEscrow("escrow-1", { pollingInterval: 5000 }));

    expect(api.getEscrow).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(api.getEscrow).toHaveBeenCalledTimes(2);

    await act(async () => {
      vi.advanceTimersByTime(5000);
    });

    expect(api.getEscrow).toHaveBeenCalledTimes(3);
    vi.useRealTimers();
  });
});
