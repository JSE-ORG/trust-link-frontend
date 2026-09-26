import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { DisputeFormNavigation } from "../DisputeFormNavigation";

type Step = 1 | 2 | 3 | 4;

function setup(overrides: { currentStep?: Step; isSubmitting?: boolean } = {}) {
  // The no-op body types each spy as () => void, matching the component props.
  const onBack = vi.fn(() => {});
  const onNext = vi.fn(() => {});
  const onSubmit = vi.fn(() => {});

  render(
    <DisputeFormNavigation
      currentStep={overrides.currentStep ?? 1}
      isSubmitting={overrides.isSubmitting ?? false}
      onBack={onBack}
      onNext={onNext}
      onSubmit={onSubmit}
    />
  );

  return { onBack, onNext, onSubmit };
}

describe("DisputeFormNavigation", () => {
  it("renders only the Next control on the first step", () => {
    setup({ currentStep: 1 });

    expect(screen.getByTestId("next-button")).toBeInTheDocument();
    expect(screen.queryByTestId("back-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("submit-button")).not.toBeInTheDocument();
  });

  it.each([2, 3])("renders Back and Next together on step %i", (step) => {
    setup({ currentStep: step as 2 | 3 });

    expect(screen.getByTestId("back-button")).toBeInTheDocument();
    expect(screen.getByTestId("next-button")).toBeInTheDocument();
    expect(screen.queryByTestId("submit-button")).not.toBeInTheDocument();
  });

  it("replaces Next with Submit on the final step", () => {
    setup({ currentStep: 4 });

    expect(screen.getByTestId("back-button")).toBeInTheDocument();
    expect(screen.queryByTestId("next-button")).not.toBeInTheDocument();

    const submit = screen.getByTestId("submit-button");
    expect(submit).toHaveTextContent("Submit Dispute");
  });

  it("exposes every control as a native button with an accessible name", () => {
    setup({ currentStep: 4 });

    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Submit Dispute" })
    ).toBeInTheDocument();
    expect(screen.getByTestId("back-button")).toHaveAttribute("type", "button");
  });

  it("routes clicks to the matching callback", async () => {
    const user = userEvent.setup();
    const callbacks = setup({ currentStep: 2 });

    await user.click(screen.getByTestId("back-button"));
    await user.click(screen.getByTestId("next-button"));

    expect(callbacks.onBack).toHaveBeenCalledTimes(1);
    expect(callbacks.onNext).toHaveBeenCalledTimes(1);
    expect(callbacks.onSubmit).not.toHaveBeenCalled();
  });

  it("submits from the final step's click", async () => {
    const user = userEvent.setup();
    const callbacks = setup({ currentStep: 4 });

    await user.click(screen.getByTestId("submit-button"));

    expect(callbacks.onSubmit).toHaveBeenCalledTimes(1);
  });

  it.each(["Enter", " "])("activates Back with %s", (key) => {
    const callbacks = setup({ currentStep: 2 });

    fireEvent.keyDown(screen.getByTestId("back-button"), { key });

    expect(callbacks.onBack).toHaveBeenCalledTimes(1);
  });

  it.each(["Enter", " "])("activates Next with %s", (key) => {
    const callbacks = setup({ currentStep: 1 });

    fireEvent.keyDown(screen.getByTestId("next-button"), { key });

    expect(callbacks.onNext).toHaveBeenCalledTimes(1);
  });

  it.each(["Enter", " "])("activates Submit with %s", (key) => {
    const callbacks = setup({ currentStep: 4 });

    fireEvent.keyDown(screen.getByTestId("submit-button"), { key });

    expect(callbacks.onSubmit).toHaveBeenCalledTimes(1);
  });

  it("ignores keys that are not Enter or Space", () => {
    const callbacks = setup({ currentStep: 1 });

    fireEvent.keyDown(screen.getByTestId("next-button"), { key: "a" });
    fireEvent.keyDown(screen.getByTestId("next-button"), { key: "Tab" });

    expect(callbacks.onNext).not.toHaveBeenCalled();
  });

  it("prevents the default action for keyboard activation", () => {
    setup({ currentStep: 1 });

    const event = new KeyboardEvent("keydown", {
      key: " ",
      bubbles: true,
      cancelable: true,
    });
    screen.getByTestId("next-button").dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });

  it("reaches the controls through the Tab key", async () => {
    const user = userEvent.setup();
    setup({ currentStep: 2 });

    await user.tab();
    expect(screen.getByTestId("back-button")).toHaveFocus();

    await user.tab();
    expect(screen.getByTestId("next-button")).toHaveFocus();
  });

  it("disables every control while a submission is in flight", () => {
    setup({ currentStep: 2, isSubmitting: true });

    expect(screen.getByTestId("back-button")).toBeDisabled();
    expect(screen.getByTestId("next-button")).toBeDisabled();
  });

  it("does not fire callbacks for clicks on disabled controls", async () => {
    const user = userEvent.setup();
    const callbacks = setup({ currentStep: 4, isSubmitting: true });

    await user.click(screen.getByTestId("submit-button"));

    expect(callbacks.onSubmit).not.toHaveBeenCalled();
  });

  it("shows the in-progress label on the final step while submitting", () => {
    setup({ currentStep: 4, isSubmitting: true });

    expect(screen.getByTestId("submit-button")).toHaveTextContent(
      "Submitting..."
    );
  });
});
