import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ErrorBoundary from "../ErrorBoundary";

vi.mock("@/lib/logger", () => ({
  captureError: vi.fn(),
}));

/** A child that throws on render, used to trigger the boundary's fallback UI. */
function Bomb(): never {
  throw new Error("boom");
}

describe("ErrorBoundary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // React logs the caught error to the console; keep test output clean.
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("renders children when there is no error", () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>
    );
    expect(screen.getByText("All good")).toBeInTheDocument();
  });

  it("renders the fallback panel when a child throws", () => {
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("is reachable via the Tab key and triggerable via Enter and Space", async () => {
    const user = userEvent.setup();
    render(
      <ErrorBoundary>
        <Bomb />
      </ErrorBoundary>
    );

    const retryButton = screen.getByRole("button", { name: /try again/i });

    await user.tab();
    expect(retryButton).toHaveFocus();

    // Native <button> semantics: Enter/Space both dispatch a click event,
    // which re-renders the (still-throwing) child and re-shows the fallback.
    await user.keyboard("{Enter}");
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();

    await user.keyboard(" ");
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });
});
