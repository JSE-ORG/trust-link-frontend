import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

// Mock next/navigation
const mockBack = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: mockBack }),
}));

// Mock next/link to render a plain anchor
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

import NotFound from "./not-found";

describe("NotFound (404 page)", () => {
  it("renders the 404 heading and description", () => {
    render(<NotFound />);

    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText("Page not found")).toBeInTheDocument();
    expect(
      screen.getByText(
        /the page you.re looking for doesn.t exist or has been moved/i
      )
    ).toBeInTheDocument();
  });

  it('includes a "Home" link that navigates to /', () => {
    render(<NotFound />);

    const homeLink = screen.getByRole("link", { name: /home/i });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute("href", "/");
  });

  it('includes a "Go Back" button that calls router.back()', async () => {
    const user = userEvent.setup();
    render(<NotFound />);

    const backButton = screen.getByRole("button", { name: /go back/i });
    expect(backButton).toBeInTheDocument();

    await user.click(backButton);
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
