import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

// Mock next/link to render a plain anchor.
vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import ErrorPage from "./error";

describe("Error (500 page) — issue #89", () => {
  const noop = () => {};

  it("renders the 500 heading and description", () => {
    render(<ErrorPage error={new Error("boom")} reset={noop} />);

    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(
      screen.getByText(/an unexpected error occurred on our end/i)
    ).toBeInTheDocument();
  });

  it('includes a "Try Again" button that calls reset() (retry functionality)', async () => {
    const reset = vi.fn();
    const user = userEvent.setup();
    render(<ErrorPage error={new Error("boom")} reset={reset} />);

    const retry = screen.getByRole("button", { name: /try again/i });
    expect(retry).toBeInTheDocument();

    await user.click(retry);
    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('includes a "Go Home" link that navigates to / (home navigation)', () => {
    render(<ErrorPage error={new Error("boom")} reset={noop} />);

    const home = screen.getByRole("link", { name: /go home/i });
    expect(home).toBeInTheDocument();
    expect(home).toHaveAttribute("href", "/");
  });

  it("shows the error digest when present", () => {
    const err = Object.assign(new Error("boom"), { digest: "abc123" });
    render(<ErrorPage error={err} reset={noop} />);
    expect(screen.getByText(/abc123/)).toBeInTheDocument();
  });
});
