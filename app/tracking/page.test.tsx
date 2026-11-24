import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";

import TrackingPage from "./page";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

describe("TrackingPage", () => {
  const pushMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(useRouter).mockReturnValue({
      push: pushMock,
      back: vi.fn(),
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    });
  });

  it("renders page title and preserves existing tracking instructions", () => {
    render(<TrackingPage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Track Your Order" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "To track your order, please use the tracking link provided by your vendor."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The tracking URL should look like:/i)
    ).toBeInTheDocument();
    expect(screen.getByText("/track/[escrowId]")).toBeInTheDocument();
  });

  it("renders the escrow ID lookup form with accessible elements", () => {
    render(<TrackingPage />);

    const form = screen.getByRole("form", { name: "Escrow ID lookup" });
    expect(form).toBeInTheDocument();

    const input = screen.getByPlaceholderText("Enter escrow ID...");
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveAttribute("aria-invalid", "false");

    const submitBtn = screen.getByRole("button", { name: "Track Order" });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toHaveAttribute("type", "submit");
  });

  it("shows validation feedback for blank ID and does not navigate", async () => {
    const user = userEvent.setup();
    render(<TrackingPage />);

    const submitBtn = screen.getByRole("button", { name: "Track Order" });
    await user.click(submitBtn);

    const error = screen.getByRole("alert");
    expect(error).toHaveTextContent("Please enter a valid escrow ID.");
    expect(pushMock).not.toHaveBeenCalled();

    const input = screen.getByPlaceholderText("Enter escrow ID...");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", "tracking-error");
  });

  it("shows validation feedback for whitespace-only ID and does not navigate", async () => {
    const user = userEvent.setup();
    render(<TrackingPage />);

    const input = screen.getByPlaceholderText("Enter escrow ID...");
    await user.type(input, "     ");

    const submitBtn = screen.getByRole("button", { name: "Track Order" });
    await user.click(submitBtn);

    expect(screen.getByRole("alert")).toHaveTextContent("Please enter a valid escrow ID.");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("clears validation error when typing", async () => {
    const user = userEvent.setup();
    render(<TrackingPage />);

    const submitBtn = screen.getByRole("button", { name: "Track Order" });
    await user.click(submitBtn);
    expect(screen.getByRole("alert")).toBeInTheDocument();

    const input = screen.getByPlaceholderText("Enter escrow ID...");
    await user.type(input, "e");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("navigates to encoded /track/{id} path for a valid ID on button click", async () => {
    const user = userEvent.setup();
    render(<TrackingPage />);

    const input = screen.getByPlaceholderText("Enter escrow ID...");
    await user.type(input, "escrow-12345");

    const submitBtn = screen.getByRole("button", { name: "Track Order" });
    await user.click(submitBtn);

    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith("/track/escrow-12345");
  });

  it("works with Enter key and trims and encodes the ID properly", async () => {
    const user = userEvent.setup();
    render(<TrackingPage />);

    const input = screen.getByPlaceholderText("Enter escrow ID...");
    await user.type(input, "  order/item#99  {Enter}");

    expect(pushMock).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith(`/track/${encodeURIComponent("order/item#99")}`);
  });

  describe("Recent Lookups (issue #1064)", () => {
    it("saves submitted escrow ID to localStorage under trustlink.recent_tracking", async () => {
      const user = userEvent.setup();
      render(<TrackingPage />);

      const input = screen.getByPlaceholderText("Enter escrow ID...");
      await user.type(input, "escrow-101");

      const submitBtn = screen.getByRole("button", { name: "Track Order" });
      await user.click(submitBtn);

      const stored = JSON.parse(
        localStorage.getItem("trustlink.recent_tracking") || "[]"
      );
      expect(stored).toEqual(["escrow-101"]);
    });

    it("displays stored recent lookups and allows one-click navigation", async () => {
      localStorage.setItem(
        "trustlink.recent_tracking",
        JSON.stringify(["escrow-101", "escrow-202"])
      );

      const user = userEvent.setup();
      render(<TrackingPage />);

      expect(screen.getByRole("heading", { level: 2, name: "Recent Lookups" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Track escrow-101" })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Track escrow-202" })).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Track escrow-101" }));
      expect(pushMock).toHaveBeenCalledWith("/track/escrow-101");
    });

    it("caps history at 5 items and prevents duplicates by moving recent to front", async () => {
      localStorage.setItem(
        "trustlink.recent_tracking",
        JSON.stringify(["item-1", "item-2", "item-3", "item-4", "item-5"])
      );

      const user = userEvent.setup();
      render(<TrackingPage />);

      const input = screen.getByPlaceholderText("Enter escrow ID...");
      await user.type(input, "item-6");

      const submitBtn = screen.getByRole("button", { name: "Track Order" });
      await user.click(submitBtn);

      let stored = JSON.parse(
        localStorage.getItem("trustlink.recent_tracking") || "[]"
      );
      expect(stored).toEqual(["item-6", "item-1", "item-2", "item-3", "item-4"]);
      expect(stored).toHaveLength(5);

      // Submitting existing item moves it to front with no duplicates
      await user.clear(input);
      await user.type(input, "item-3");
      await user.click(submitBtn);

      stored = JSON.parse(
        localStorage.getItem("trustlink.recent_tracking") || "[]"
      );
      expect(stored).toEqual(["item-3", "item-6", "item-1", "item-2", "item-4"]);
      expect(stored).toHaveLength(5);
    });

    it("clears stored history when Clear History is clicked", async () => {
      localStorage.setItem(
        "trustlink.recent_tracking",
        JSON.stringify(["escrow-101"])
      );

      const user = userEvent.setup();
      render(<TrackingPage />);

      expect(screen.getByRole("heading", { level: 2, name: "Recent Lookups" })).toBeInTheDocument();

      const clearBtn = screen.getByRole("button", { name: /clear history/i });
      await user.click(clearBtn);

      expect(localStorage.getItem("trustlink.recent_tracking")).toBeNull();
      expect(screen.queryByRole("heading", { level: 2, name: "Recent Lookups" })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Track escrow-101" })).not.toBeInTheDocument();
    });

    it("handles invalid or non-existent localStorage data safely", () => {
      localStorage.setItem("trustlink.recent_tracking", "not-a-json-{{{{");

      expect(() => render(<TrackingPage />)).not.toThrow();
      expect(screen.queryByRole("heading", { level: 2, name: "Recent Lookups" })).not.toBeInTheDocument();
    });
  });
});
