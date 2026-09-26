import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import OfflineBanner from "../OfflineBanner";

describe("OfflineBanner", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "onLine", { value: true, writable: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when online", () => {
    const { container } = render(<OfflineBanner />);
    expect(container.firstChild).toBeNull();
  });

  it("renders alert banner when offline", () => {
    Object.defineProperty(navigator, "onLine", { value: false, writable: true });
    render(<OfflineBanner />);
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText(/You are offline/)).toBeInTheDocument();
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
});
