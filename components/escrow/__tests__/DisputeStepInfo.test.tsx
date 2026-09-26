import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, type MockInstance, vi } from "vitest";

import type { DisputeFormValues } from "@/lib/validations/dispute";
import { DisputeStepInfo } from "../DisputeStepInfo";

const defaultFormData: DisputeFormValues = {
  name: "",
  email: "",
  orderNumber: "",
  reason: "",
  description: "",
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
    <DisputeStepInfo
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

describe("DisputeStepInfo", () => {
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
    it("renders step 1 container and heading", () => {
      renderStep();

      expect(screen.getByTestId("step-1")).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: /step 1: personal information/i, level: 2 })
      ).toBeInTheDocument();
    });

    it("renders all fields with empty initial values by default", () => {
      renderStep();

      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const orderNumberInput = screen.getByLabelText(/order number/i);

      expect(nameInput).toHaveValue("");
      expect(emailInput).toHaveValue("");
      expect(orderNumberInput).toHaveValue("");
    });

    it("populates input fields with provided formData", () => {
      renderStep({
        formData: {
          name: "Alice Smith",
          email: "alice@example.com",
          orderNumber: "ORD-9999",
        },
      });

      expect(screen.getByLabelText(/full name/i)).toHaveValue("Alice Smith");
      expect(screen.getByLabelText(/email address/i)).toHaveValue("alice@example.com");
      expect(screen.getByLabelText(/order number/i)).toHaveValue("ORD-9999");
    });

    it("sets correct input element types and accessibility attributes when valid", () => {
      renderStep();

      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const orderNumberInput = screen.getByLabelText(/order number/i);

      expect(nameInput).toHaveAttribute("type", "text");
      expect(nameInput).toHaveAttribute("aria-label", "name");
      expect(nameInput).toHaveAttribute("aria-invalid", "false");
      expect(nameInput).not.toHaveAttribute("aria-describedby");

      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("aria-label", "email");
      expect(emailInput).toHaveAttribute("aria-invalid", "false");
      expect(emailInput).not.toHaveAttribute("aria-describedby");

      expect(orderNumberInput).toHaveAttribute("type", "text");
      expect(orderNumberInput).toHaveAttribute("aria-label", "order number");
      expect(orderNumberInput).toHaveAttribute("aria-invalid", "false");
      expect(orderNumberInput).not.toHaveAttribute("aria-describedby");
    });
  });

  describe("user interactions", () => {
    it("calls updateField with name when full name input changes", () => {
      const { updateField } = renderStep();
      const nameInput = screen.getByLabelText(/full name/i);

      fireEvent.change(nameInput, { target: { value: "Bob Marley" } });

      expect(updateField).toHaveBeenCalledTimes(1);
      expect(updateField).toHaveBeenCalledWith("name", "Bob Marley");
    });

    it("calls updateField with email when email address input changes", () => {
      const { updateField } = renderStep();
      const emailInput = screen.getByLabelText(/email address/i);

      fireEvent.change(emailInput, { target: { value: "bob@example.com" } });

      expect(updateField).toHaveBeenCalledTimes(1);
      expect(updateField).toHaveBeenCalledWith("email", "bob@example.com");
    });

    it("calls updateField with orderNumber when order number input changes", () => {
      const { updateField } = renderStep();
      const orderNumberInput = screen.getByLabelText(/order number/i);

      fireEvent.change(orderNumberInput, { target: { value: "ORD-12345" } });

      expect(updateField).toHaveBeenCalledTimes(1);
      expect(updateField).toHaveBeenCalledWith("orderNumber", "ORD-12345");
    });

    it("handles user typing with userEvent", async () => {
      const user = userEvent.setup();
      const { updateField } = renderStep();

      const nameInput = screen.getByLabelText(/full name/i);
      await user.type(nameInput, "A");

      expect(updateField).toHaveBeenCalledWith("name", "A");
    });
  });

  describe("error states & validation feedback", () => {
    it("shows error for name field when errors.name is defined", () => {
      renderStep({
        errors: { name: "Full name is required" },
      });

      const nameInput = screen.getByLabelText(/full name/i);
      const nameError = screen.getByText("Full name is required");

      expect(nameError).toBeInTheDocument();
      expect(nameError).toHaveAttribute("id", "name-error");
      expect(nameError).toHaveAttribute("role", "alert");
      expect(nameInput).toHaveAttribute("aria-invalid", "true");
      expect(nameInput).toHaveAttribute("aria-describedby", "name-error");
    });

    it("shows error for email field when errors.email is defined", () => {
      renderStep({
        errors: { email: "Please enter a valid email address" },
      });

      const emailInput = screen.getByLabelText(/email address/i);
      const emailError = screen.getByText("Please enter a valid email address");

      expect(emailError).toBeInTheDocument();
      expect(emailError).toHaveAttribute("id", "email-error");
      expect(emailError).toHaveAttribute("role", "alert");
      expect(emailInput).toHaveAttribute("aria-invalid", "true");
      expect(emailInput).toHaveAttribute("aria-describedby", "email-error");
    });

    it("shows error for orderNumber field when errors.orderNumber is defined", () => {
      renderStep({
        errors: { orderNumber: "Order number must start with ORD-" },
      });

      const orderInput = screen.getByLabelText(/order number/i);
      const orderError = screen.getByText("Order number must start with ORD-");

      expect(orderError).toBeInTheDocument();
      expect(orderError).toHaveAttribute("id", "orderNumber-error");
      expect(orderError).toHaveAttribute("role", "alert");
      expect(orderInput).toHaveAttribute("aria-invalid", "true");
      expect(orderInput).toHaveAttribute("aria-describedby", "orderNumber-error");
    });

    it("displays multiple field errors concurrently", () => {
      renderStep({
        errors: {
          name: "Name is required",
          email: "Invalid email format",
          orderNumber: "Invalid order number",
        },
      });

      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const orderInput = screen.getByLabelText(/order number/i);

      expect(nameInput).toHaveAttribute("aria-invalid", "true");
      expect(emailInput).toHaveAttribute("aria-invalid", "true");
      expect(orderInput).toHaveAttribute("aria-invalid", "true");

      const alerts = screen.getAllByRole("alert");
      expect(alerts).toHaveLength(3);
      expect(alerts[0]).toHaveTextContent("Name is required");
      expect(alerts[1]).toHaveTextContent("Invalid email format");
      expect(alerts[2]).toHaveTextContent("Invalid order number");
    });

    it("does not render any error alerts when errors object is empty", () => {
      renderStep({ errors: {} });

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });

    it("ignores errors that belong to other step fields", () => {
      renderStep({
        errors: {
          reason: "Reason is required",
          description: "Description is too short",
        },
      });

      expect(screen.queryByRole("alert")).not.toBeInTheDocument();

      const nameInput = screen.getByLabelText(/full name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const orderInput = screen.getByLabelText(/order number/i);

      expect(nameInput).toHaveAttribute("aria-invalid", "false");
      expect(emailInput).toHaveAttribute("aria-invalid", "false");
      expect(orderInput).toHaveAttribute("aria-invalid", "false");
    });
  });
});
