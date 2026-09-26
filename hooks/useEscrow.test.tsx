import { act,renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { SWRConfig } from "swr";
import { beforeEach,describe, expect, it, vi } from "vitest";

import * as api from "@/lib/api";
import { Escrow, EscrowStatusConst } from "@/types";

import { useEscrow } from "./useEscrow";

vi.mock("@/lib/api", () => ({
  getEscrow: vi.fn(),
}));

const mockEscrow: Escrow = {
  id: "escrow-1",
  vendorId: "vendor-1",
  amount: 100,
  item: "Test Item",
  status: EscrowStatusConst.FUNDED,
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

    expect(result.current.data).toEqual(mockEscrow);
    expect(result.current.error).toBeNull();
  });

  it("should handle error state when API fails", async () => {
    const error = new Error("Not Found");
    vi.mocked(api.getEscrow).mockRejectedValue(error);

    const { result } = renderHook(() => useEscrow("escrow-1"), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeNull();
  });

  it("should update data on refetch", async () => {
    vi.mocked(api.getEscrow).mockResolvedValue(mockEscrow);

    const { result } = renderHook(() => useEscrow("escrow-1"), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updatedEscrow = { ...mockEscrow, status: EscrowStatusConst.COMPLETED };
    vi.mocked(api.getEscrow).mockResolvedValue(updatedEscrow);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data?.status).toBe(EscrowStatusConst.COMPLETED);
  });

  it("should poll for data at specified interval", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(api.getEscrow).mockResolvedValue(mockEscrow);

    const { result } = renderHook(() => useEscrow("escrow-1", { refreshInterval: 100 }), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(api.getEscrow).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(500);

    await waitFor(() => {
      expect(api.getEscrow).toHaveBeenCalledTimes(2);
    }, { timeout: 3000 });

    vi.useRealTimers();
  });
});
