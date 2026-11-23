import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import OfflineBanner from "../OfflineBanner";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: "en" },
  }),
}));

describe("OfflineBanner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "onLine", { value: true, writable: true });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when online", () => {
    const { container } = render(<OfflineBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders alert banner with retry button when offline", () => {
    Object.defineProperty(navigator, "onLine", { value: false, writable: true });
    render(<OfflineBanner />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/You are offline/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /check connection/i })).toBeInTheDocument();
  });

  it("has aria-live assertive", () => {
    Object.defineProperty(navigator, "onLine", { value: false, writable: true });
    render(<OfflineBanner />);
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");
  });

  it("hides when online event fires", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, writable: true });
    render(<OfflineBanner />);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    Object.defineProperty(navigator, "onLine", { value: true, writable: true });
    act(() => {
      window.dispatchEvent(new Event("online"));
    });

    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  it("shows when offline event fires", async () => {
    render(<OfflineBanner />);
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();

    Object.defineProperty(navigator, "onLine", { value: false, writable: true });
    act(() => {
      window.dispatchEvent(new Event("offline"));
    });

    await waitFor(() => {
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });

  it("re-checks connectivity and hides banner with success toast when back online", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, writable: true });
    render(<OfflineBanner />);

    const retryBtn = screen.getByRole("button", { name: /check connection/i });
    expect(retryBtn).toBeInTheDocument();

    // User is back online
    Object.defineProperty(navigator, "onLine", { value: true, writable: true });

    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith("Connection restored. You are back online.");
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  it("notifies user with error toast when retry finds connection is still offline", async () => {
    Object.defineProperty(navigator, "onLine", { value: false, writable: true });
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network Error")));
    render(<OfflineBanner />);

    const retryBtn = screen.getByRole("button", { name: /check connection/i });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Still offline. Please check your network connection.");
      expect(screen.getByRole("alert")).toBeInTheDocument();
    });
  });
});
