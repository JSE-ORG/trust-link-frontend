import { createRequire } from "node:module";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ThemeToggle from "@/components/ui/ThemeToggle";

// react-dom ships no bundled declarations here (no @types/react-dom), so the
// server renderer is loaded through require with a narrow local shape.
const nodeRequire = createRequire(import.meta.url);
const { renderToString } = nodeRequire("react-dom/server") as {
  renderToString: (element: ReactElement) => string;
};

const theme = vi.hoisted(() => ({
  resolvedTheme: "light" as string | undefined,
  setTheme: vi.fn(),
}));

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: theme.resolvedTheme,
    setTheme: theme.setTheme,
  }),
}));

beforeEach(() => {
  theme.resolvedTheme = "light";
  theme.setTheme.mockClear();
});

describe("ThemeToggle", () => {
  describe("rendering per resolved theme", () => {
    it("shows the moon icon and 'switch to dark mode' label on a light theme", () => {
      render(<ThemeToggle />);

      const button = screen.getByRole("button", { name: "Switch to dark mode" });
      expect(button).toHaveAttribute("type", "button");
      expect(document.querySelector("svg.lucide-moon")).toBeInTheDocument();
      expect(document.querySelector("svg.lucide-sun")).not.toBeInTheDocument();
      expect(document.querySelector("svg.lucide-monitor")).not.toBeInTheDocument();
    });

    it("shows the sun icon and 'switch to system theme' label on a dark theme", () => {
      theme.resolvedTheme = "dark";
      render(<ThemeToggle />);

      expect(screen.getByRole("button", { name: "Switch to system theme" })).toBeInTheDocument();
      expect(document.querySelector("svg.lucide-sun")).toBeInTheDocument();
      expect(document.querySelector("svg.lucide-moon")).not.toBeInTheDocument();
    });

    it("treats an unresolved 'system' value as light", () => {
      theme.resolvedTheme = "system";
      render(<ThemeToggle />);

      // resolvedTheme should always be concrete once next-themes has resolved
      // "system"; until then the component deliberately falls back to light.
      expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
      expect(document.querySelector("svg.lucide-moon")).toBeInTheDocument();
    });

    it("treats a missing resolvedTheme as light", () => {
      theme.resolvedTheme = undefined;
      render(<ThemeToggle />);

      expect(screen.getByRole("button", { name: "Switch to dark mode" })).toBeInTheDocument();
    });
  });

  describe("cycling", () => {
    it("cycles light -> dark -> system -> resolved light", async () => {
      const { rerender } = render(<ThemeToggle />);

      await userEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));
      expect(theme.setTheme).toHaveBeenLastCalledWith("dark");

      theme.resolvedTheme = "dark";
      rerender(<ThemeToggle />);
      await userEvent.click(screen.getByRole("button", { name: "Switch to system theme" }));
      expect(theme.setTheme).toHaveBeenLastCalledWith("system");

      // next-themes resolves "system" to the OS preference before the next
      // interaction, so the observable cycle continues from that value.
      theme.resolvedTheme = "light";
      rerender(<ThemeToggle />);
      await userEvent.click(screen.getByRole("button", { name: "Switch to dark mode" }));

      expect(theme.setTheme.mock.calls).toEqual([["dark"], ["system"], ["dark"]]);
    });

    it("is keyboard operable", async () => {
      render(<ThemeToggle />);
      const button = screen.getByRole("button", { name: "Switch to dark mode" });

      button.focus();
      await userEvent.keyboard("{Enter}");

      expect(theme.setTheme).toHaveBeenCalledWith("dark");
    });

    it("does not call setTheme on render", () => {
      render(<ThemeToggle />);

      expect(theme.setTheme).not.toHaveBeenCalled();
    });
  });

  describe("hydration safety", () => {
    it("renders a neutral placeholder without a button during server render", () => {
      // Effects do not run on the server, so the first client render must not
      // commit theme-dependent markup that could mismatch during hydration.
      const html = renderToString(<ThemeToggle />);

      expect(html).not.toContain("<button");
      expect(html).not.toContain("aria-label");
      expect(html).toContain("rounded-full");
    });
  });
});
