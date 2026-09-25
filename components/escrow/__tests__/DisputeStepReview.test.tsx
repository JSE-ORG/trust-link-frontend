import "@testing-library/jest-dom";

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";

import type { DisputeStepReviewProps } from "../DisputeStepReview";
import { DisputeStepReview } from "../DisputeStepReview";

/**
 * Fixture typed with the exported props interface, so this suite also fails to
 * compile if the component's public contract drifts from what it renders.
 */
function makeProps(
  overrides: Partial<DisputeStepReviewProps> = {},
): DisputeStepReviewProps {
  return {
    formData: {
      name: "John Doe",
      email: "john@example.com",
      orderNumber: "ORD-123",
      reason: "product_not_received",
      description: "A detailed description of what went wrong with the order.",
      files: [
        new File(["a"], "photo.jpg", { type: "image/jpeg" }),
        new File(["b"], "receipt.pdf", { type: "application/pdf" }),
      ],
      agreeToTerms: false,
    },
    errors: {},
    updateField: vi.fn(),
    ...overrides,
  };
}

describe("DisputeStepReview", () => {
  test("summarises every captured field and the evidence count", () => {
    render(<DisputeStepReview {...makeProps()} />);

    expect(screen.getByTestId("step-4")).toBeInTheDocument();
    expect(screen.getByTestId("review-section")).toBeInTheDocument();

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();
    expect(screen.getByText("ORD-123")).toBeInTheDocument();
    expect(screen.getByText("product_not_received")).toBeInTheDocument();
    expect(
      screen.getByText("A detailed description of what went wrong with the order."),
    ).toBeInTheDocument();
    expect(screen.getByText("2 file(s) uploaded")).toBeInTheDocument();
  });

  test("lists each uploaded evidence file by name", () => {
    render(<DisputeStepReview {...makeProps()} />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveTextContent("photo.jpg");
    expect(items[1]).toHaveTextContent("receipt.pdf");
  });

  test("reports 0 files without throwing when no evidence was uploaded", () => {
    const props = makeProps();
    render(<DisputeStepReview {...props} formData={{ ...props.formData, files: [] }} />);

    expect(screen.getByText("0 file(s) uploaded")).toBeInTheDocument();
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });

  test("mirrors the terms checkbox state and writes changes back through updateField", () => {
    const updateField = vi.fn<DisputeStepReviewProps["updateField"]>();
    render(<DisputeStepReview {...makeProps({ updateField })} />);

    const checkbox = screen.getByLabelText(/agree to terms/i);
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(updateField).toHaveBeenCalledWith("agreeToTerms", true);
  });

  test("renders a checked checkbox when the form data already agrees", () => {
    const props = makeProps();
    render(<DisputeStepReview {...props} formData={{ ...props.formData, agreeToTerms: true }} />);

    expect(screen.getByLabelText(/agree to terms/i)).toBeChecked();
  });

  test("shows the terms error as an alert wired to the checkbox", () => {
    render(
      <DisputeStepReview {...makeProps({ errors: { agreeToTerms: "You must agree to the terms" } })} />,
    );

    const checkbox = screen.getByLabelText(/agree to terms/i);
    expect(checkbox).toHaveAttribute("aria-invalid", "true");
    expect(checkbox).toHaveAttribute("aria-describedby", "agreeToTerms-error");

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("You must agree to the terms");
    expect(alert).toHaveAttribute("id", "agreeToTerms-error");
  });

  test("stays clean when there is no terms error", () => {
    render(<DisputeStepReview {...makeProps()} />);

    const checkbox = screen.getByLabelText(/agree to terms/i);
    expect(checkbox).toHaveAttribute("aria-invalid", "false");
    expect(checkbox).not.toHaveAttribute("aria-describedby");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
