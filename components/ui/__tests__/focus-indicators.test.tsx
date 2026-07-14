import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Accordion } from "../Accordion";
import ThemeToggle from "../ThemeToggle";

vi.mock("@/components/providers/ThemeProvider", () => ({
  useTheme: () => ({ theme: "light", setTheme: vi.fn() }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

describe("Focus indicators (issue #333)", () => {
  describe("Accordion", () => {
    const items = [
      { question: "What is TrustLink?", answer: "A decentralised escrow platform." },
      { question: "How do fees work?", answer: "Fees are set per product." },
    ];

    it("accordion button receives visible focus ring on Tab", async () => {
      const user = userEvent.setup();
      render(<Accordion items={items} />);

      const buttons = screen.getAllByRole("button");
      await user.tab();

      expect(buttons[0]).toHaveFocus();
      // Verify focus-visible ring classes are present on the element
      expect(buttons[0].className).toMatch(/focus-visible:ring-2/);
    });

    it("second accordion button receives focus on second Tab", async () => {
      const user = userEvent.setup();
      render(<Accordion items={items} />);

      await user.tab();
      await user.tab();

      expect(screen.getAllByRole("button")[1]).toHaveFocus();
    });

    it("accordion button is keyboard-activatable with Enter", async () => {
      const user = userEvent.setup();
      render(<Accordion items={items} />);

      await user.tab();
      await user.keyboard("{Enter}");

      expect(screen.getAllByRole("button")[0]).toHaveAttribute("aria-expanded", "true");
    });
  });

  describe("ThemeToggle", () => {
    it("theme toggle button receives focus on Tab", async () => {
      const user = userEvent.setup();
      render(<ThemeToggle />);

      await user.tab();

      const btn = screen.getByRole("button");
      expect(btn).toHaveFocus();
    });

    it("theme toggle has visible focus ring classes", () => {
      render(<ThemeToggle />);

      const btn = screen.getByRole("button");
      expect(btn.className).toMatch(/focus-visible:ring-2/);
    });

    it("theme toggle has an accessible label", () => {
      render(<ThemeToggle />);

      expect(screen.getByRole("button", { name: /switch to/i })).toBeInTheDocument();
    });
  });
});
