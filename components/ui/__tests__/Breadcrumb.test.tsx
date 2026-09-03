import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Breadcrumb, type BreadcrumbItem } from "../Breadcrumb";

const items: BreadcrumbItem[] = [
  { label: "Home", href: "/" },
  { label: "Track Order", href: "/tracking" },
  { label: "Order esc_12345678901234567890" },
];

describe("Breadcrumb", () => {
  it("renders a nav landmark labelled Breadcrumb", () => {
    render(<Breadcrumb items={items} />);

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    expect(nav).toBeInTheDocument();

    const breadcrumbList = within(nav).getByRole("list");
    const crumbs = within(breadcrumbList).getAllByRole("listitem");
    expect(crumbs).toHaveLength(items.length);
  });

  it("renders every parent crumb as a clickable link to its route", () => {
    render(<Breadcrumb items={items} />);

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    const links = within(nav).getAllByRole("link");
    expect(links).toHaveLength(2);
    expect(links[0]).toHaveAttribute("href", "/");
    expect(links[0]).toHaveTextContent("Home");
    expect(links[1]).toHaveAttribute("href", "/tracking");
    expect(links[1]).toHaveTextContent("Track Order");
  });

  it("renders the current page as non-clickable text with aria-current", () => {
    render(<Breadcrumb items={items} />);

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    const crumbs = within(nav).getAllByRole("listitem");

    // Only parent crumbs are links — the current page must not be an anchor.
    expect(within(nav).getAllByRole("link")).toHaveLength(2);

    const currentCrumb = crumbs[crumbs.length - 1];
    expect(within(currentCrumb).queryByRole("link")).toBeNull();
    expect(currentCrumb).toHaveTextContent("Order esc_12345678901234567890");
    expect(currentCrumb.querySelector('[aria-current="page"]')).not.toBeNull();
  });

  it("truncates long labels so they never overflow the mobile viewport", () => {
    const { container } = render(<Breadcrumb items={items} />);

    const ol = container.querySelector("ol");
    // The trail wraps (flex-wrap) …
    expect(ol).toHaveClass("flex-wrap");
    // … and every label ellipsizes (truncate) when space runs out.
    const labels = container.querySelectorAll("span.truncate");
    expect(labels).toHaveLength(items.length);
    const lastLabel = container.querySelector("ol li:last-child span.truncate");
    expect(lastLabel?.textContent).toBe("Order esc_12345678901234567890");
  });

  it("treats an item without an href as plain text even when not last", () => {
    render(
      <Breadcrumb
        items={[
          { label: "Section", href: "/section" },
          { label: "Grouping (not a link)" },
          { label: "Current" },
        ]}
      />
    );

    const nav = screen.getByRole("navigation", { name: "Breadcrumb" });
    const crumbs = within(nav).getAllByRole("listitem");

    expect(within(nav).queryAllByRole("link")).toHaveLength(1);

    const groupingCrumb = crumbs[1];
    expect(groupingCrumb).toHaveTextContent("Grouping (not a link)");
    expect(within(groupingCrumb).queryByRole("link")).toBeNull();

    expect(crumbs[2].querySelector('[aria-current="page"]')).not.toBeNull();
  });
});
