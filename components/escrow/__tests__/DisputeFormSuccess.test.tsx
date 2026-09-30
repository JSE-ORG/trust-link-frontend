import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DisputeFormSuccess } from "../DisputeFormSuccess";

const MESSAGE = "Your dispute for order ORD-123 has been received.";

function renderSuccess(onReset = vi.fn()) {
  render(<DisputeFormSuccess message={MESSAGE} onReset={onReset} />);
  return onReset;
}

describe("DisputeFormSuccess", () => {
  it("renders the confirmation message returned by the submit call", () => {
    renderSuccess();

    expect(screen.getByText(MESSAGE)).toBeInTheDocument();
    expect(
      screen.getByText(/dispute submitted successfully/i)
    ).toBeInTheDocument();
  });

  it("renders the follow-up expectation copy", () => {
    renderSuccess();

    expect(
      screen.getByText(/within 3-5 business days/i)
    ).toBeInTheDocument();
  });

  it("announces itself as a polite live region for assistive technology", () => {
    renderSuccess();

    const status = screen.getByRole("status");
    expect(status).toHaveAttribute("aria-live", "polite");
    expect(screen.getByTestId("success-state")).toBe(status);
  });

  it("calls onReset when 'Submit Another Dispute' is clicked", () => {
    const onReset = renderSuccess();

    fireEvent.click(screen.getByTestId("new-dispute-button"));

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("calls onReset when Enter is pressed on the reset control", () => {
    const onReset = renderSuccess();

    fireEvent.keyDown(screen.getByTestId("new-dispute-button"), {
      key: "Enter",
    });

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("calls onReset when Space is pressed on the reset control", () => {
    const onReset = renderSuccess();

    fireEvent.keyDown(screen.getByTestId("new-dispute-button"), { key: " " });

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("ignores keys other than Enter and Space", () => {
    const onReset = renderSuccess();

    fireEvent.keyDown(screen.getByTestId("new-dispute-button"), { key: "a" });

    expect(onReset).not.toHaveBeenCalled();
  });

  it("does not call onReset before the user interacts", () => {
    const onReset = renderSuccess();

    expect(onReset).not.toHaveBeenCalled();
  });

  it("renders an empty message without crashing", () => {
    render(<DisputeFormSuccess message="" onReset={vi.fn()} />);

    expect(screen.getByTestId("success-state")).toBeInTheDocument();
  });
});
