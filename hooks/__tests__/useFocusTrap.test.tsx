import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode, useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { useFocusTrap } from "@/hooks/useFocusTrap";

interface TrapHarnessProps {
  isActive: boolean;
  autoFocus?: boolean;
  onEscape?: () => void;
  children: ReactNode;
}

function TrapHarness({ isActive, autoFocus, onEscape, children }: TrapHarnessProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  useFocusTrap(containerRef, isActive, { autoFocus, onEscape });

  return (
    <div ref={containerRef} data-testid="trap">
      {children}
    </div>
  );
}

describe("useFocusTrap", () => {
  describe("initial focus", () => {
    it("moves focus to the first focusable element when autoFocus is enabled", async () => {
      render(
        <TrapHarness isActive autoFocus>
          <button>First action</button>
          <button>Last action</button>
        </TrapHarness>
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "First action" })).toHaveFocus();
      });
    });

    it("leaves the current focus untouched when autoFocus is not requested", () => {
      render(
        <div>
          <button>Outside trigger</button>
          <TrapHarness isActive>
            <button>Inside action</button>
          </TrapHarness>
        </div>
      );

      const trigger = screen.getByRole("button", { name: "Outside trigger" });
      trigger.focus();

      expect(trigger).toHaveFocus();
      expect(screen.getByRole("button", { name: "Inside action" })).not.toHaveFocus();
    });

    it("skips disabled controls when picking the first element", async () => {
      render(
        <TrapHarness isActive autoFocus>
          <button disabled>Disabled action</button>
          <button>Enabled action</button>
        </TrapHarness>
      );

      await waitFor(() => {
        expect(screen.getByRole("button", { name: "Enabled action" })).toHaveFocus();
      });
    });
  });

  describe("tab cycling", () => {
    it("wraps forward from the last element back to the first", async () => {
      render(
        <TrapHarness isActive>
          <button>First action</button>
          <button>Middle action</button>
          <button>Last action</button>
        </TrapHarness>
      );

      const first = screen.getByRole("button", { name: "First action" });
      const last = screen.getByRole("button", { name: "Last action" });

      last.focus();
      await userEvent.tab();

      expect(first).toHaveFocus();
    });

    it("wraps backward from the first element to the last", async () => {
      render(
        <TrapHarness isActive>
          <button>First action</button>
          <button>Middle action</button>
          <button>Last action</button>
        </TrapHarness>
      );

      const first = screen.getByRole("button", { name: "First action" });
      const last = screen.getByRole("button", { name: "Last action" });

      first.focus();
      await userEvent.tab({ shift: true });

      expect(last).toHaveFocus();
    });

    it("does not intercept Tab between interior elements", async () => {
      render(
        <TrapHarness isActive>
          <button>First action</button>
          <button>Last action</button>
        </TrapHarness>
      );

      const first = screen.getByRole("button", { name: "First action" });
      const last = screen.getByRole("button", { name: "Last action" });

      first.focus();
      await userEvent.tab();

      expect(last).toHaveFocus();
    });

    it("does not trap Tab while inactive", async () => {
      render(
        <div>
          <TrapHarness isActive={false}>
            <button>Inside action</button>
          </TrapHarness>
          <button>Outside action</button>
        </div>
      );

      const inside = screen.getByRole("button", { name: "Inside action" });
      const outside = screen.getByRole("button", { name: "Outside action" });

      inside.focus();
      await userEvent.tab();

      expect(outside).toHaveFocus();
    });

    it("does nothing when the container has no focusable elements", async () => {
      render(
        <TrapHarness isActive autoFocus>
          <p>No controls here</p>
        </TrapHarness>
      );

      expect(document.body).toHaveFocus();

      await userEvent.tab();
      expect(document.body).toHaveFocus();
    });
  });

  describe("escape handling", () => {
    it("invokes onEscape when Escape is pressed", async () => {
      const onEscape = vi.fn();
      render(
        <TrapHarness isActive onEscape={onEscape}>
          <button>Inside action</button>
        </TrapHarness>
      );

      await userEvent.keyboard("{Escape}");

      expect(onEscape).toHaveBeenCalledTimes(1);
    });

    it("does not invoke onEscape while inactive", async () => {
      const onEscape = vi.fn();
      render(
        <TrapHarness isActive={false} onEscape={onEscape}>
          <button>Inside action</button>
        </TrapHarness>
      );

      await userEvent.keyboard("{Escape}");

      expect(onEscape).not.toHaveBeenCalled();
    });
  });

  describe("deactivation and cleanup", () => {
    it("removes its keydown listener when it deactivates", async () => {
      const onEscape = vi.fn();
      const { rerender } = render(
        <TrapHarness isActive onEscape={onEscape}>
          <button>Inside action</button>
        </TrapHarness>
      );

      rerender(
        <TrapHarness isActive={false} onEscape={onEscape}>
          <button>Inside action</button>
        </TrapHarness>
      );

      await userEvent.keyboard("{Escape}");

      expect(onEscape).not.toHaveBeenCalled();
    });

    it("removes its keydown listener on unmount", async () => {
      const onEscape = vi.fn();
      const { unmount } = render(
        <TrapHarness isActive onEscape={onEscape}>
          <button>Inside action</button>
        </TrapHarness>
      );

      unmount();
      await userEvent.keyboard("{Escape}");

      expect(onEscape).not.toHaveBeenCalled();
    });

    it("does not restore focus to the previously focused element (hook contract)", async () => {
      // This is a deliberate contract difference: `hooks/useFocusTrap.ts` only
      // traps Tab/Escape. Automatic focus restoration is provided by the
      // `<FocusTrap />` component wrapper, which captures and restores focus
      // itself. Consumers using the bare hook must restore focus manually.
      function RestorationHarness() {
        const [isActive, setIsActive] = useState(false);

        return (
          <div>
            <button onClick={() => setIsActive(true)}>Open trap</button>
            {isActive ? (
              <TrapHarness isActive autoFocus>
                <button>Inside action</button>
              </TrapHarness>
            ) : null}
            {isActive ? <button onClick={() => setIsActive(false)}>Close trap</button> : null}
          </div>
        );
      }

      render(<RestorationHarness />);
      const trigger = screen.getByRole("button", { name: "Open trap" });
      await userEvent.click(trigger);

      const inside = screen.getByRole("button", { name: "Inside action" });
      await waitFor(() => expect(inside).toHaveFocus());

      await userEvent.click(screen.getByRole("button", { name: "Close trap" }));

      expect(trigger).not.toHaveFocus();
      expect(inside).not.toBeInTheDocument();
    });
  });
});
