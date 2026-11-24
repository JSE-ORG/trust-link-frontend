import { act, renderHook, waitFor } from "@testing-library/react";
import React from "react";
import { SWRConfig } from "swr";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "@/lib/api";
import { Escrow, EscrowStatusConst } from "@/types";

import {
  isTerminalEscrowStatus,
  TERMINAL_ESCROW_STATUSES,
  useEscrow,
} from "./useEscrow";

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

const createWrapper = () => {
  const cache = new Map();
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <SWRConfig value={{ provider: () => cache, dedupingInterval: 0 }}>
      {children}
    </SWRConfig>
  );
  Wrapper.displayName = "SWRTestWrapper";
  return Wrapper;
};

describe("isTerminalEscrowStatus", () => {
  it("identifies terminal settlement statuses correctly", () => {
    expect(isTerminalEscrowStatus(EscrowStatusConst.COMPLETED)).toBe(true);
    expect(isTerminalEscrowStatus(EscrowStatusConst.RELEASED)).toBe(true);
    expect(isTerminalEscrowStatus(EscrowStatusConst.REFUNDED)).toBe(true);
    expect(isTerminalEscrowStatus(EscrowStatusConst.EXPIRED)).toBe(true);
    expect(isTerminalEscrowStatus("completed")).toBe(true);
    expect(isTerminalEscrowStatus("released")).toBe(true);
  });

  it("identifies active settlement statuses correctly", () => {
    expect(isTerminalEscrowStatus(EscrowStatusConst.PENDING)).toBe(false);
    expect(isTerminalEscrowStatus(EscrowStatusConst.FUNDED)).toBe(false);
    expect(isTerminalEscrowStatus(EscrowStatusConst.SHIPPED)).toBe(false);
    expect(isTerminalEscrowStatus(EscrowStatusConst.DISPUTED)).toBe(false);
    expect(isTerminalEscrowStatus(null)).toBe(false);
    expect(isTerminalEscrowStatus(undefined)).toBe(false);
  });
});

describe("useEscrow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should have isLoading: true on mount and false after success", async () => {
    vi.mocked(api.getEscrow).mockResolvedValue(mockEscrow);

    const { result } = renderHook(() => useEscrow("escrow-1"), {
      wrapper: createWrapper(),
    });

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

    const { result } = renderHook(() => useEscrow("escrow-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toEqual(error);
    expect(result.current.data).toBeNull();
  });

  it("should update data on refetch", async () => {
    vi.mocked(api.getEscrow).mockResolvedValue(mockEscrow);

    const { result } = renderHook(() => useEscrow("escrow-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const updatedEscrow = {
      ...mockEscrow,
      status: EscrowStatusConst.COMPLETED,
    };
    vi.mocked(api.getEscrow).mockResolvedValue(updatedEscrow);

    await act(async () => {
      await result.current.refetch();
    });

    expect(result.current.data?.status).toBe(EscrowStatusConst.COMPLETED);
  });

  it("should poll for data at specified interval for active statuses", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.mocked(api.getEscrow).mockResolvedValue(mockEscrow);

    const { result } = renderHook(
      () => useEscrow("escrow-1", { refreshInterval: 100 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(api.getEscrow).toHaveBeenCalledTimes(1);

    await vi.advanceTimersByTimeAsync(500);

    await waitFor(
      () => {
        expect(api.getEscrow).toHaveBeenCalledTimes(2);
      },
      { timeout: 3000 }
    );

    vi.useRealTimers();
  });

  it.each([
    EscrowStatusConst.COMPLETED,
    EscrowStatusConst.RELEASED,
    EscrowStatusConst.REFUNDED,
    EscrowStatusConst.EXPIRED,
  ])(
    "stops periodic polling when escrow status is terminal (%s)",
    async (terminalStatus) => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const terminalEscrow: Escrow = {
        ...mockEscrow,
        status: terminalStatus,
      };
      vi.mocked(api.getEscrow).mockResolvedValue(terminalEscrow);

      const { result } = renderHook(
        () => useEscrow("escrow-1", { refreshInterval: 100 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(api.getEscrow).toHaveBeenCalledTimes(1);

      // Advance time by multiple polling intervals
      await vi.advanceTimersByTimeAsync(500);

      // Call count remains 1 because polling stopped for terminal state
      expect(api.getEscrow).toHaveBeenCalledTimes(1);

      vi.useRealTimers();
    }
  );

  it.each([
    EscrowStatusConst.PENDING,
    EscrowStatusConst.FUNDED,
    EscrowStatusConst.SHIPPED,
    EscrowStatusConst.DISPUTED,
  ])(
    "continues periodic polling when escrow status is active (%s)",
    async (activeStatus) => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      const activeEscrow: Escrow = {
        ...mockEscrow,
        status: activeStatus,
      };
      vi.mocked(api.getEscrow).mockResolvedValue(activeEscrow);

      const { result } = renderHook(
        () => useEscrow("escrow-1", { refreshInterval: 100 }),
        { wrapper: createWrapper() }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(api.getEscrow).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(500);

      await waitFor(
        () => {
          expect(api.getEscrow).toHaveBeenCalledTimes(2);
        },
        { timeout: 3000 }
      );

      vi.useRealTimers();
    }
  );

  it("manual refetch still retrieves updated data after periodic polling stops", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const terminalEscrow: Escrow = {
      ...mockEscrow,
      status: EscrowStatusConst.COMPLETED,
    };
    vi.mocked(api.getEscrow).mockResolvedValue(terminalEscrow);

    const { result } = renderHook(
      () => useEscrow("escrow-1", { refreshInterval: 100 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(api.getEscrow).toHaveBeenCalledTimes(1);

    // Periodic polling is inactive
    await vi.advanceTimersByTimeAsync(500);
    expect(api.getEscrow).toHaveBeenCalledTimes(1);

    // Manual refetch still works and fetches new data
    const updatedEscrow: Escrow = {
      ...terminalEscrow,
      item: "Updated Item Details",
    };
    vi.mocked(api.getEscrow).mockResolvedValue(updatedEscrow);

    await act(async () => {
      await result.current.refetch();
    });

    expect(api.getEscrow).toHaveBeenCalledTimes(2);
    expect(result.current.data?.item).toBe("Updated Item Details");

    vi.useRealTimers();
  });
});
