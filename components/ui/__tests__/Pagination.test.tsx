import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import i18n from "@/lib/i18n";

import Pagination from "../Pagination";

afterEach(async () => {
  await act(async () => {
    await i18n.changeLanguage("en");
  });
});

describe("Pagination", () => {
  it("renders a labeled navigation region and disables boundary buttons", () => {
    render(
      <Pagination currentPage={1} totalPages={3} onPageChange={vi.fn()} />
    );

    expect(
      screen.getByRole("navigation", { name: "Pagination" })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toHaveAttribute(
      "aria-disabled",
      "true"
    );
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toHaveAttribute(
      "aria-disabled",
      "false"
    );
  });

  it("changes to adjacent pages and supports native keyboard activation", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(
      <Pagination
        currentPage={2}
        totalPages={3}
        onPageChange={onPageChange}
        className="custom-pagination"
      />
    );

    expect(screen.getByRole("navigation")).toHaveClass("custom-pagination");

    await user.tab();
    expect(screen.getByRole("button", { name: "Previous" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(onPageChange).toHaveBeenCalledWith(1);

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(onPageChange).toHaveBeenLastCalledWith(3);
  });

  it("shows a single page by default and can hide it on request", () => {
    const props = { currentPage: 1, totalPages: 1, onPageChange: vi.fn() };

    const { rerender } = render(<Pagination {...props} />);
    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();

    rerender(<Pagination {...props} hideOnSinglePage />);
    expect(screen.queryByRole("navigation", { name: "Pagination" })).not.toBeInTheDocument();
  });

  it.each([
    ["fr", "Page", "sur", "Précédent", "Suivant"],
    ["pcm", "Showing page", "of", "Previous", "Next"],
  ])(
    "localizes pagination labels for %s",
    async (language, showingPage, ofPages, previous, next) => {
      await act(async () => {
        await i18n.changeLanguage(language);
      });
      render(
        <Pagination currentPage={2} totalPages={3} onPageChange={vi.fn()} />
      );

      expect(screen.getByRole("navigation")).toHaveTextContent(
        new RegExp(`${showingPage}\\s*2\\s*${ofPages}\\s*3`)
      );
      expect(screen.getByRole("button", { name: previous })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: next })).toBeInTheDocument();
    }
  );
});
