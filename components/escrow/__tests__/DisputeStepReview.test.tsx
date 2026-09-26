import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";

import type { DisputeFormValues } from "@/lib/validations/dispute";

import { DisputeStepReview } from "../DisputeStepReview";

const defaultFormData: DisputeFormValues = {
  name: "Jane Doe",
  email: "jane@example.com",
  orderNumber: "ORD-12345",
  reason: "damaged_product",
  description: "Item arrived broken into multiple pieces inside box.",
  files: [],
  agreeToTerms: false,
};

function renderStep(overrides: {
  formData?: Partial<DisputeFormValues>;
  errors?: Partial<Record<keyof DisputeFormValues, string>>;
  updateField?: <K extends keyof DisputeFormValues>(field: K, value: DisputeFormValues[K]) => void;
} = {}) {
  const updateField = overrides.updateField ?? vi.fn<(field: any, value: any) => void>();
  const formData: DisputeFormValues = {
    ...defaultFormData,
    ...overrides.formData,
  };
  const errors = overrides.errors ?? {};

  const utils = render(
    <DisputeStepReview
      formData={formData}
      errors={errors}
      updateField={updateField}
    />
  );

  return {
    ...utils,
    updateField,
    formData,
    errors,
  };
}

describe("DisputeStepReview", () => {
  let consoleError: MockInstance<typeof console.error>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, "error");
  });

  afterEach(() => {
    // Guards against act() warnings and unexpected React errors leaking into test output.
    expect(consoleError).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  describe("rendering", () => {
    it("renders step 4 container, heading, and review section", () => {
      renderStep();

      expect(screen.getByTestId("step-4")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /step 4: review & submit/i, level: 2 })
      ).toBeInTheDocument();
      expect(screen.getByTestId("review-section")).toBeInTheDocument();
    });

    it("displays personal information summary correctly", () => {
      renderStep({
        formData: {
          name: "John Smith",
          email: "john@example.com",
          orderNumber: "ORD-98765",
        },
      });

      expect(screen.getByRole("heading", { name: /personal information/i })).toBeInTheDocument();
      expect(screen.getByText(/john smith/i)).toBeInTheDocument();
      expect(screen.getByText(/john@example.com/i)).toBeInTheDocument();
      expect(screen.getByText(/ord-98765/i)).toBeInTheDocument();
    });

    it("displays dispute details summary correctly", () => {
      renderStep({
        formData: {
          reason: "wrong_product",
          description: "Received a pair of shoes instead of a jacket.",
        },
      });

      expect(screen.getByRole("heading", { name: /dispute details/i })).toBeInTheDocument();
      expect(screen.getByText(/wrong_product/i)).toBeInTheDocument();
      expect(
        screen.getByText(/received a pair of shoes instead of a jacket\./i)
      ).toBeInTheDocument();
    });

    it("displays evidence summary when no files are uploaded", () => {
      renderStep({
        formData: { files: [] },
      });

      expect(screen.getByRole("heading", { name: /evidence/i })).toBeInTheDocument();
      expect(screen.getByText(/0 file\(s\) uploaded/i)).toBeInTheDocument();
      expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
    });

    it("displays evidence summary with uploaded files list", () => {
      const file1 = new File(["content1"], "invoice.pdf", { type: "application/pdf" });
      const file2 = new File(["content2"], "photo.png", { type: "image/png" });

      renderStep({
        formData: { files: [file1, file2] },
      });

      expect(screen.getByText(/2 file\(s\) uploaded/i)).toBeInTheDocument();
      const listItems = screen.getAllByRole("listitem");
      expect(listItems).toHaveLength(2);
      expect(listItems[0]).toHaveTextContent("invoice.pdf");
      expect(listItems[1]).toHaveTextContent("photo.png");
    });

    it("renders confirmation terms checkbox with correct initial state and accessibility attributes", () => {
      renderStep({
        formData: { agreeToTerms: false },
      });

      const checkbox = screen.getByRole("checkbox", { name: /agree to terms/i });
      expect(checkbox).not.toBeChecked();
      expect(checkbox).toHaveAttribute("type", "checkbox");
      expect(checkbox).toHaveAttribute("aria-invalid", "false");
      expect(checkbox).not.toHaveAttribute("aria-describedby");
    });

    it("renders checkbox checked when agreeToTerms is true", () => {
      renderStep({
        formData: { agreeToTerms: true },
      });

      const checkbox = screen.getByRole("checkbox", { name: /agree to terms/i });
      expect(checkbox).toBeChecked();
    });
  });

  describe("user interactions", () => {
    it("calls updateField with agreeToTerms and true when checking the checkbox", async () => {
      const user = userEvent.setup();
      const { updateField } = renderStep({
        formData: { agreeToTerms: false },
      });

      const checkbox = screen.getByRole("checkbox", { name: /agree to terms/i });
      await user.click(checkbox);

      expect(updateField).toHaveBeenCalledTimes(1);
      expect(updateField).toHaveBeenCalledWith("agreeToTerms", true);
    });

    it("calls updateField with agreeToTerms and false when unchecking the checkbox", () => {
      const { updateField } = renderStep({
        formData: { agreeToTerms: true },
      });

      const checkbox = screen.getByRole("checkbox", { name: /agree to terms/i });
      fireEvent.click(checkbox);

      expect(updateField).toHaveBeenCalledTimes(1);
      expect(updateField).toHaveBeenCalledWith("agreeToTerms", false);
    });
  });

  describe("error states & validation feedback", () => {
    it("displays validation error when errors.agreeToTerms is provided", () => {
      renderStep({
        errors: { agreeToTerms: "You must confirm the information provided is accurate" },
      });

      const checkbox = screen.getByRole("checkbox", { name: /agree to terms/i });
      const errorMsg = screen.getByText("You must confirm the information provided is accurate");

      expect(errorMsg).toBeInTheDocument();
      expect(errorMsg).toHaveAttribute("id", "agreeToTerms-error");
      expect(errorMsg).toHaveAttribute("role", "alert");
      expect(checkbox).toHaveAttribute("aria-invalid", "true");
      expect(checkbox).toHaveAttribute("aria-describedby", "agreeToTerms-error");
    });

    it("does not render any error alerts when errors object is empty", () => {
      renderStep({ errors: {} });

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("ignores errors belonging to other steps or fields", () => {
      renderStep({
        errors: {
          name: "Name error",
          reason: "Reason error",
          files: "Files error",
        },
      });

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();

      const checkbox = screen.getByRole("checkbox", { name: /agree to terms/i });
      expect(checkbox).toHaveAttribute("aria-invalid", "false");
    });
  });
});
