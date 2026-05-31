import { renderHook, waitFor, act } from "@testing-library/react";
import { useEscrow } from "./useEscrow";
import { describe, it, expect, vi, beforeEach } from "vitest";
import * as api from "@/lib/api";
import { Escrow } from "@/types";
import { SWRConfig } from "swr";
import React from "react";

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

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>
    {children}
  </SWRConfig>
);

describe("useEscrow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have isLoading: true on mount and false after success", async () => {
    vi.mocked(api.getEscrow).mockResolvedValue(mockEscrow);

    const { result } = renderHook(() => useEscrow("escrow-1"), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.escrow).toEqual(mockEscrow);
    expect(result.current.error).toBeUndefined();
  });

  it("should handle error state when API fails", async () => {
    const error = new Error("Not Found");
    vi.mocked(api.getEscrow).mockRejectedValue(error);

    const { result } = renderHook(() => useEscrow("escrow-1"), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.escrow).toBeUndefined();
  });

  it("should update data on refetch", async () => {
    vi.mocked(api.getEscrow).mockResolvedValue(mockEscrow);

    const { result } = renderHook(() => useEscrow("escrow-1"), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updatedEscrow = { ...mockEscrow, status: "COMPLETED" as const };
    vi.mocked(api.getEscrow).mockResolvedValue(updatedEscrow);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.escrow?.status).toBe("COMPLETED");
  });

  it("should poll for data at specified interval", async () => {
    vi.mocked(api.getEscrow).mockResolvedValue(mockEscrow);

    const { result } = renderHook(() => useEscrow("escrow-1", { refreshInterval: 100 }), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(api.getEscrow).toHaveBeenCalledTimes(1);

    // Wait for the next poll to happen naturally without fake timers if they are problematic
    await waitFor(() => {
      expect(api.getEscrow).toHaveBeenCalledTimes(2);
    }, { timeout: 1000 });
  });
});
