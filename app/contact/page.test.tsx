import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ContactForm from "@/components/contact/ContactForm";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ContactForm component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all expected form fields and category options", () => {
    render(<ContactForm />);

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/inquiry category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/subject/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/message/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send message/i })).toBeInTheDocument();

    // Verify predefined categories
    const categorySelect = screen.getByLabelText(/inquiry category/i);
    expect(categorySelect).toHaveTextContent("Support");
    expect(categorySelect).toHaveTextContent("Dispute Inquiries");
    expect(categorySelect).toHaveTextContent("Vendor Partnership");
    expect(categorySelect).toHaveTextContent("Bug Report");
  });

  it("validates required fields and shows inline errors when submitted empty", async () => {
    render(<ContactForm />);

    const submitBtn = screen.getByRole("button", { name: /send message/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/full name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email address is required/i)).toBeInTheDocument();
    expect(screen.getByText(/please select an inquiry category/i)).toBeInTheDocument();
    expect(screen.getByText(/subject is required/i)).toBeInTheDocument();
    expect(screen.getByText(/message is required/i)).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith(
      expect.stringMatching(/please correct the errors/i)
    );
  });

  it("validates email format properly", async () => {
    render(<ContactForm />);

    const emailInput = screen.getByLabelText(/email address/i);
    await userEvent.type(emailInput, "not-an-email");

    const submitBtn = screen.getByRole("button", { name: /send message/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/please enter a valid email address/i)).toBeInTheDocument();
  });

  it("enforces minimum message length of 20 characters", async () => {
    render(<ContactForm />);

    const messageInput = screen.getByLabelText(/message/i);
    await userEvent.type(messageInput, "Too short");

    const submitBtn = screen.getByRole("button", { name: /send message/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/message must be at least 20 characters/i)).toBeInTheDocument();
  });

  it("submits successfully with valid data, shows loading state, and renders success screen with reset option", async () => {
    render(<ContactForm />);

    await userEvent.type(screen.getByLabelText(/full name/i), "Jane Doe");
    await userEvent.type(screen.getByLabelText(/email address/i), "jane@example.com");
    await userEvent.selectOptions(screen.getByLabelText(/inquiry category/i), "Support");
    await userEvent.type(screen.getByLabelText(/subject/i), "Need help with escrow funding");
    await userEvent.type(
      screen.getByLabelText(/message/i),
      "I am having an issue with my transaction and need support with the contract."
    );

    const submitBtn = screen.getByRole("button", { name: /send message/i });
    fireEvent.click(submitBtn);

    // Verify loading state
    expect(screen.getByRole("button", { name: /submitting/i })).toBeDisabled();

    // Verify success confirmation view
    await waitFor(
      () => {
        expect(screen.getByTestId("contact-success-screen")).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    expect(screen.getByText(/message sent successfully/i)).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith(
      expect.stringMatching(/message has been sent successfully/i)
    );

    // Verify reset capability
    const resetBtn = screen.getByRole("button", { name: /send another message/i });
    fireEvent.click(resetBtn);

    expect(screen.queryByTestId("contact-success-screen")).not.toBeInTheDocument();
    expect(screen.getByLabelText(/full name/i)).toHaveValue("");
  });
});
