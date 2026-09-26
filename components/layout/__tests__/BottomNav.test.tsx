import { render, screen } from "@testing-library/react";
import { beforeEach,describe, expect, it, vi } from "vitest";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("@/components/providers/NotificationProvider", () => ({
  useNotifications: () => ({ unreadCount: 0 }),
  NotificationProvider: ({ children }: { children: React.ReactNode }) => children,
}));

vi.mock("next/link", () => ({
  default: ({ href, children, className, "aria-label": ariaLabel, "aria-current": ariaCurrent }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    "aria-label"?: string;
    "aria-current"?: "page" | "step" | "location" | "date" | "time" | boolean;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel} aria-current={ariaCurrent}>
      {children}
    </a>
  ),
}));

import BottomNav from "../BottomNav";

describe("BottomNav", () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue("/dashboard");
  });

  it("matches snapshot when rendering on dashboard", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    const { container } = render(<BottomNav />);
    expect(container).toMatchSnapshot();
  });

  it("matches snapshot when rendering on create page", () => {
    mockUsePathname.mockReturnValue("/create");
    const { container } = render(<BottomNav />);
    expect(container).toMatchSnapshot();
  });

  it("matches snapshot when rendering on tracking page", () => {
    mockUsePathname.mockReturnValue("/tracking");
    const { container } = render(<BottomNav />);
    expect(container).toMatchSnapshot();
  });

  it("matches snapshot when rendering on profile page", () => {
    mockUsePathname.mockReturnValue("/profile");
    const { container } = render(<BottomNav />);
    expect(container).toMatchSnapshot();
  });

  it("matches snapshot with nested route", () => {
    mockUsePathname.mockReturnValue("/dashboard/settings");
    const { container } = render(<BottomNav />);
    expect(container).toMatchSnapshot();
  });

  it("renders all 4 navigation items", () => {
    render(<BottomNav />);
    expect(screen.getByLabelText("Dashboard")).toBeInTheDocument();
    expect(screen.getByLabelText("Create Link")).toBeInTheDocument();
    expect(screen.getByLabelText("Track Order")).toBeInTheDocument();
    expect(screen.getByLabelText("Profile")).toBeInTheDocument();
  });

  it("has nav role and aria-label", () => {
    render(<BottomNav />);
    const nav = screen.getByRole("navigation", { name: "Mobile navigation" });
    expect(nav).toBeInTheDocument();
  });

  it("marks current path link with aria-current=page", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(<BottomNav />);
    expect(screen.getByLabelText("Dashboard")).toHaveAttribute("aria-current", "page");
  });

  it("does not mark non-active links as current", () => {
    mockUsePathname.mockReturnValue("/dashboard");
    render(<BottomNav />);
    expect(screen.getByLabelText("Create Link")).not.toHaveAttribute("aria-current");
    expect(screen.getByLabelText("Track Order")).not.toHaveAttribute("aria-current");
    expect(screen.getByLabelText("Profile")).not.toHaveAttribute("aria-current");
  });

  it("marks Create Link active when on /create path", () => {
    mockUsePathname.mockReturnValue("/create");
    render(<BottomNav />);
    expect(screen.getByLabelText("Create Link")).toHaveAttribute("aria-current", "page");
    expect(screen.getByLabelText("Dashboard")).not.toHaveAttribute("aria-current");
  });

  it("marks Track Order active when on /tracking path", () => {
    mockUsePathname.mockReturnValue("/tracking");
    render(<BottomNav />);
    expect(screen.getByLabelText("Track Order")).toHaveAttribute("aria-current", "page");
  });

  it("marks Profile active when on /profile path", () => {
    mockUsePathname.mockReturnValue("/profile");
    render(<BottomNav />);
    expect(screen.getByLabelText("Profile")).toHaveAttribute("aria-current", "page");
  });

  it("matches nested sub-path as active (e.g. /dashboard/settings)", () => {
    mockUsePathname.mockReturnValue("/dashboard/settings");
    render(<BottomNav />);
    expect(screen.getByLabelText("Dashboard")).toHaveAttribute("aria-current", "page");
  });

  it("renders visible labels for all items", () => {
    render(<BottomNav />);
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Create Link")).toBeInTheDocument();
    expect(screen.getByText("Track Order")).toBeInTheDocument();
    expect(screen.getByText("Profile")).toBeInTheDocument();
  });
});
