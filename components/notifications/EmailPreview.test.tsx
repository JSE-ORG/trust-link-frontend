import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import EmailPreview from "./EmailPreview";

describe("EmailPreview", () => {
  const defaultProps = {
    eventKey: "funded" as const,
    open: true,
    onOpenChange: vi.fn(),
  };

  it("renders the dialog title", () => {
    render(<EmailPreview {...defaultProps} />);
    expect(screen.getByText("Email Preview")).toBeInTheDocument();
  });

  it("renders the email heading for funded event", () => {
    render(<EmailPreview {...defaultProps} />);
    expect(screen.getByText("Your escrow has been funded")).toBeInTheDocument();
  });

  it("renders the email body for funded event", () => {
    render(<EmailPreview {...defaultProps} />);
    expect(
      screen.getByText(/A buyer has successfully funded an escrow transaction/)
    ).toBeInTheDocument();
  });

  it("renders the TrustLink branding", () => {
    render(<EmailPreview {...defaultProps} />);
    expect(screen.getByText("TrustLink")).toBeInTheDocument();
  });

  it("renders the dashboard link", () => {
    render(<EmailPreview {...defaultProps} />);
    expect(screen.getByText("View in Dashboard")).toBeInTheDocument();
  });

  it("does not render content when closed", () => {
    render(<EmailPreview {...defaultProps} open={false} />);
    expect(screen.queryByText("Email Preview")).not.toBeInTheDocument();
  });

  it("renders shipped event content", () => {
    render(<EmailPreview {...defaultProps} eventKey="shipped" />);
    expect(screen.getByText("The item has been shipped")).toBeInTheDocument();
  });

  it("renders delivered event content", () => {
    render(<EmailPreview {...defaultProps} eventKey="delivered" />);
    expect(screen.getByText("The item has been delivered")).toBeInTheDocument();
  });

  it("renders disputed event content", () => {
    render(<EmailPreview {...defaultProps} eventKey="disputed" />);
    expect(screen.getByText("A dispute has been opened")).toBeInTheDocument();
  });

  it("renders completed event content", () => {
    render(<EmailPreview {...defaultProps} eventKey="completed" />);
    expect(
      screen.getByText("Escrow transaction completed")
    ).toBeInTheDocument();
  });
});
