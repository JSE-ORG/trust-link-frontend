import { act, render, renderHook, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getVendorEscrows } from "@/lib/api";
import type { Escrow } from "@/types";

import { NotificationProvider, useNotifications } from "./NotificationProvider";

vi.mock("@/lib/api", () => ({ getVendorEscrows: vi.fn() }));

const wrapper = ({ children }: { children: ReactNode }) => <NotificationProvider>{children}</NotificationProvider>;

const ESCROWS: Escrow[] = [
  {
    id: "escrow",
    vendorId: "vendor",
    item: "Order",
    amount: 10,
    status: "FUNDED",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-03T00:00:00Z",
    history: [
      {
        id: "older",
        escrowId: "escrow",
        status: "PENDING",
        timestamp: "2026-01-01T00:00:00Z",
        description: "Created",
      },
      {
        id: "newer",
        escrowId: "escrow",
        status: "FUNDED",
        timestamp: "2026-01-02T00:00:00Z",
        description: "Paid",
      },
    ],
  },
];

function NotificationConsumer({ name }: { name: string }) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  return (
    <div>
      <output data-testid={`${name}-unread`}>{unreadCount}</output>
      <output data-testid={`${name}-notifications`}>
        {notifications.map(({ id, read }) => `${id}:${read}`).join(",")}
      </output>
      <button onClick={() => markAsRead("older")}>Mark older read</button>
      <button onClick={markAllAsRead}>Mark all read</button>
    </div>
  );
}

describe("notification fetch recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("wallet.jwt", "token");
    Object.defineProperty(document, "visibilityState", { value: "visible", writable: true, configurable: true });
    Object.defineProperty(document, "hidden", { value: false, writable: true, configurable: true });
    Object.defineProperty(navigator, "onLine", { value: true, writable: true, configurable: true });
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
    vi.restoreAllMocks();
    Object.defineProperty(document, "visibilityState", { value: "visible", writable: true, configurable: true });
    Object.defineProperty(document, "hidden", { value: false, writable: true, configurable: true });
    Object.defineProperty(navigator, "onLine", { value: true, writable: true, configurable: true });
  });

  it("distinguishes initial failure, recovers, and retains stale notifications", async () => {
    const interval = vi.spyOn(globalThis, "setInterval");
    vi.mocked(getVendorEscrows)
      .mockRejectedValueOnce(new Error("Offline"))
      .mockResolvedValueOnce(ESCROWS)
      .mockRejectedValueOnce(new Error("Refresh failed"))
      .mockResolvedValueOnce(ESCROWS);
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await waitFor(() => expect(result.current.error?.message).toBe("Offline"));
    expect(result.current.hasLoaded).toBe(false);
    await act(() => result.current.refetch());
    expect(result.current.error).toBeNull();
    expect(result.current.notifications).toHaveLength(2);
    await act(() => result.current.refetch());
    expect(result.current.error?.message).toBe("Refresh failed");
    expect(result.current.hasLoaded).toBe(true);
    expect(result.current.notifications).toHaveLength(2);
    await act(() => result.current.refetch());
    expect(result.current.error).toBeNull();
    expect(interval.mock.calls.filter(([, delay]) => delay === 30_000)).toHaveLength(1);
  });

  it("does not overlap a pending fetch with a retry", async () => {
    let resolveRequest!: (value: Awaited<ReturnType<typeof getVendorEscrows>>) => void;
    vi.mocked(getVendorEscrows).mockReturnValue(new Promise((resolve) => { resolveRequest = resolve; }));
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await act(() => result.current.refetch());
    expect(getVendorEscrows).toHaveBeenCalledTimes(1);
    await act(async () => { resolveRequest([]); });
    expect(result.current.hasLoaded).toBe(true);
    expect(result.current.isLoading).toBe(false);
  });

  it("shares sorted notifications and persisted read state across consumers", async () => {
    vi.mocked(getVendorEscrows).mockResolvedValue(ESCROWS);
    render(
      <NotificationProvider>
        <NotificationConsumer name="first" />
        <NotificationConsumer name="second" />
      </NotificationProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("first-notifications")).toHaveTextContent("newer:false,older:false"));
    expect(screen.getByTestId("first-unread")).toHaveTextContent("2");
    expect(screen.getByTestId("second-notifications")).toHaveTextContent("newer:false,older:false");

    await act(async () => screen.getAllByRole("button", { name: "Mark older read" })[0].click());
    expect(screen.getByTestId("first-unread")).toHaveTextContent("1");
    expect(screen.getByTestId("second-unread")).toHaveTextContent("1");
    expect(localStorage.getItem("notifications.read")).toBe('["older"]');

    await act(async () => screen.getAllByRole("button", { name: "Mark all read" })[1].click());
    expect(screen.getByTestId("first-unread")).toHaveTextContent("0");
    expect(screen.getByTestId("second-unread")).toHaveTextContent("0");
    expect(JSON.parse(localStorage.getItem("notifications.read") ?? "[]")).toEqual(["older", "newer"]);
  });

  it("polls every 30 seconds and clears the interval on unmount", async () => {
    vi.useFakeTimers();
    vi.mocked(getVendorEscrows).mockResolvedValue(ESCROWS);
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval");
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    const { unmount } = renderHook(() => useNotifications(), { wrapper });
    await act(async () => {});

    expect(getVendorEscrows).toHaveBeenCalledTimes(1);
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(getVendorEscrows).toHaveBeenCalledTimes(2);

    unmount();
    const pollInterval = setIntervalSpy.mock.results[0].value;
    expect(clearIntervalSpy).toHaveBeenCalledWith(pollInterval);
  });

  it("pauses polling while hidden and refreshes once upon returning visible", async () => {
    vi.useFakeTimers();
    vi.mocked(getVendorEscrows).mockResolvedValue(ESCROWS);

    renderHook(() => useNotifications(), { wrapper });
    await act(async () => {});
    expect(getVendorEscrows).toHaveBeenCalledTimes(1);

    // Document becomes hidden
    Object.defineProperty(document, "visibilityState", { value: "hidden", writable: true, configurable: true });
    Object.defineProperty(document, "hidden", { value: true, writable: true, configurable: true });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    // Advance timers while hidden: no requests made
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(getVendorEscrows).toHaveBeenCalledTimes(1);

    // Document returns visible
    Object.defineProperty(document, "visibilityState", { value: "visible", writable: true, configurable: true });
    Object.defineProperty(document, "hidden", { value: false, writable: true, configurable: true });
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    // Refreshes once immediately
    expect(getVendorEscrows).toHaveBeenCalledTimes(2);

    // Polling resumes
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(getVendorEscrows).toHaveBeenCalledTimes(3);
  });

  it("pauses polling while offline and refreshes once upon returning online", async () => {
    vi.useFakeTimers();
    vi.mocked(getVendorEscrows).mockResolvedValue(ESCROWS);

    renderHook(() => useNotifications(), { wrapper });
    await act(async () => {});
    expect(getVendorEscrows).toHaveBeenCalledTimes(1);

    // Network goes offline
    Object.defineProperty(navigator, "onLine", { value: false, writable: true, configurable: true });
    await act(async () => {
      window.dispatchEvent(new Event("offline"));
    });

    // Advance timers while offline: no requests made
    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(getVendorEscrows).toHaveBeenCalledTimes(1);

    // Network goes online
    Object.defineProperty(navigator, "onLine", { value: true, writable: true, configurable: true });
    await act(async () => {
      window.dispatchEvent(new Event("online"));
    });

    // Refreshes once immediately
    expect(getVendorEscrows).toHaveBeenCalledTimes(2);

    // Polling resumes
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(getVendorEscrows).toHaveBeenCalledTimes(3);
  });

  it("does not schedule API requests when mounted hidden or offline", async () => {
    vi.useFakeTimers();
    vi.mocked(getVendorEscrows).mockResolvedValue(ESCROWS);

    Object.defineProperty(document, "visibilityState", { value: "hidden", writable: true, configurable: true });
    Object.defineProperty(document, "hidden", { value: true, writable: true, configurable: true });

    renderHook(() => useNotifications(), { wrapper });
    await act(async () => {});
    expect(getVendorEscrows).toHaveBeenCalledTimes(0);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60_000);
    });
    expect(getVendorEscrows).toHaveBeenCalledTimes(0);
  });

  it("does not overlap slow requests during scheduled polling", async () => {
    vi.useFakeTimers();
    let resolveSlowRequest!: (value: Escrow[]) => void;
    vi.mocked(getVendorEscrows).mockImplementation(
      () => new Promise((resolve) => { resolveSlowRequest = resolve; })
    );

    renderHook(() => useNotifications(), { wrapper });
    await act(async () => {});
    expect(getVendorEscrows).toHaveBeenCalledTimes(1);

    // Interval ticks while the first fetch is still in flight
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(getVendorEscrows).toHaveBeenCalledTimes(1);

    // Resolve the first fetch
    await act(async () => {
      resolveSlowRequest(ESCROWS);
    });

    // Subsequent interval tick triggers next fetch
    await act(async () => {
      await vi.advanceTimersByTimeAsync(30_000);
    });
    expect(getVendorEscrows).toHaveBeenCalledTimes(2);
  });

  it("cleans up event listeners and timers on unmount", async () => {
    const removeEventListenerDocSpy = vi.spyOn(document, "removeEventListener");
    const removeEventListenerWinSpy = vi.spyOn(window, "removeEventListener");
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");

    const { unmount } = renderHook(() => useNotifications(), { wrapper });
    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(removeEventListenerDocSpy).toHaveBeenCalledWith("visibilitychange", expect.any(Function));
    expect(removeEventListenerWinSpy).toHaveBeenCalledWith("online", expect.any(Function));
    expect(removeEventListenerWinSpy).toHaveBeenCalledWith("offline", expect.any(Function));
  });

  it("does not fetch or poll for anonymous visitors", async () => {
    localStorage.clear();
    const intervalSpy = vi.spyOn(globalThis, "setInterval");
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await act(async () => {});

    expect(getVendorEscrows).not.toHaveBeenCalled();
    expect(intervalSpy.mock.calls.filter(([, delay]) => delay === 30_000)).toHaveLength(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.notifications).toHaveLength(0);
  });

  it("starts fetching and polling when a session token appears", async () => {
    localStorage.clear();
    vi.mocked(getVendorEscrows).mockResolvedValue(ESCROWS);
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await act(async () => {});
    expect(getVendorEscrows).not.toHaveBeenCalled();

    localStorage.setItem("wallet.jwt", "token");
    await act(async () => {
      window.dispatchEvent(new StorageEvent("storage", { key: "wallet.jwt" }));
    });

    await waitFor(() => expect(getVendorEscrows).toHaveBeenCalledWith("token"));
    expect(result.current.notifications).toHaveLength(2);
  });

  it("clears polling and notification state when the session expires", async () => {
    localStorage.setItem("wallet.jwt", "token");
    vi.mocked(getVendorEscrows).mockReset().mockResolvedValue(ESCROWS);
    const clearIntervalSpy = vi.spyOn(globalThis, "clearInterval");
    const { result } = renderHook(() => useNotifications(), { wrapper });
    await act(async () => {});
    await waitFor(() => expect(result.current.notifications).toHaveLength(2));

    localStorage.removeItem("wallet.jwt");
    await act(async () => {
      window.dispatchEvent(new Event("app:unauthorized"));
    });

    expect(clearIntervalSpy).toHaveBeenCalled();
    expect(result.current.notifications).toHaveLength(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.hasLoaded).toBe(false);
  });
});
