import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { DisputeFormValues } from "@/lib/validations/dispute";

import { DisputeStepDetails } from "../DisputeStepDetails";

const DESCRIPTION = "A detailed description of the problem.";

function makeValues(
  overrides: Partial<DisputeFormValues> = {}
): DisputeFormValues {
  return {
    name: "John Doe",
    email: "john@example.com",
    orderNumber: "ORD-123",
    reason: "",
    description: "",
    files: [],
    agreeToTerms: false,
    ...overrides,
  };
}

function renderStep(
  props: {
    values?: Partial<DisputeFormValues>;
    errors?: Partial<Record<keyof DisputeFormValues, string>>;
  } = {}
) {
  const updateField = vi.fn();
  render(
    <DisputeStepDetails
      formData={makeValues(props.values)}
      errors={props.errors ?? {}}
      updateField={updateField}
    />
  );
  return updateField;
}

describe("DisputeStepDetails", () => {
  it("renders the step container and its heading", () => {
    renderStep();

    expect(screen.getByTestId("step-2")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /step 2: dispute details/i })
    ).toBeInTheDocument();
  });

  it("renders a labelled control for each dispute field", () => {
    renderStep();

    expect(screen.getByText("Reason for Dispute *")).toBeInTheDocument();
    expect(screen.getByText("Description *")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "description" })).toBeInTheDocument();
  });

  it("offers every supported dispute reason", () => {
    renderStep();

    const options = within(screen.getByRole("combobox")).getAllByRole("option");

    expect(options.map((option) => option.getAttribute("value"))).toEqual([
      "",
      "product_not_received",
      "damaged_product",
      "wrong_product",
      "defective_product",
      "billing_error",
    ]);
  });

  it("reflects the reason held in form state", () => {
    renderStep({ values: { reason: "damaged_product" } });

    expect(screen.getByRole("combobox")).toHaveValue("damaged_product");
  });

  it("reports reason changes through updateField", () => {
    const updateField = renderStep();

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "wrong_product" },
    });

    expect(updateField).toHaveBeenCalledWith("reason", "wrong_product");
  });

  it("reflects the description and its character counter", () => {
    renderStep({ values: { description: DESCRIPTION } });

    expect(screen.getByRole("textbox", { name: "description" })).toHaveValue(
      DESCRIPTION
    );
    expect(
      screen.getByText(`${DESCRIPTION.length}/20 characters minimum`)
    ).toBeInTheDocument();
  });

  it("reports description changes through updateField", () => {
    const updateField = renderStep();

    fireEvent.change(screen.getByRole("textbox", { name: "description" }), {
      target: { value: "Updated details" },
    });

    expect(updateField).toHaveBeenCalledWith("description", "Updated details");
  });

  it("surfaces a field error as an alert", () => {
    renderStep({ errors: { reason: "Reason is required" } });

    expect(screen.getByRole("alert")).toHaveTextContent("Reason is required");
  });

  it("renders no alert when there are no errors", () => {
    renderStep();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("marks the failing control invalid and points it at the error", () => {
    renderStep({ errors: { reason: "Reason is required" } });

    const select = screen.getByRole("combobox");
    expect(select).toHaveAttribute("aria-invalid", "true");
    expect(select).toHaveAttribute("aria-describedby", "reason-error");
  });

  it("replaces the character hint with the error once a field fails", () => {
    renderStep({
      values: { description: DESCRIPTION },
      errors: { description: "Description must be at least 20 characters" },
    });

    expect(
      screen.queryByText(`${DESCRIPTION.length}/20 characters minimum`)
    ).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Description must be at least 20 characters"
    );
  });
});
