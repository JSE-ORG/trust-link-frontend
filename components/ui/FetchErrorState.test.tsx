import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import FetchErrorState, { getFetchErrorMessage } from "./FetchErrorState";

describe("FetchErrorState", () => {
  it("renders title and message", () => {
    render(
      <FetchErrorState
        title="Load failed"
        message="Unable to fetch data."
      />
    );

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Load failed")).toBeInTheDocument();
    expect(screen.getByText("Unable to fetch data.")).toBeInTheDocument();
  });

  it("calls onRetry when the retry button is clicked", async () => {
    const onRetry = vi.fn();
    render(
      <FetchErrorState
        message="Network error."
        onRetry={onRetry}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("getFetchErrorMessage", () => {
  it("returns the error message from Error instances", () => {
    expect(getFetchErrorMessage(new Error("Request failed"))).toBe("Request failed");
  });

  it("returns the fallback for non-Error values", () => {
    expect(getFetchErrorMessage("bad", "Fallback message")).toBe("Fallback message");
  });
});
