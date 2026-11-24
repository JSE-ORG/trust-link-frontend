import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React, { useRef, useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useFocusTrap } from "@/hooks/useFocusTrap";

import FocusTrap from "../FocusTrap";

describe("FocusTrap component behavioral tests", () => {
  it("focuses the first enabled element by default on activation", async () => {
    render(
      <FocusTrap active={true}>
        <button>First</button>
        <button>Second</button>
      </FocusTrap>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
    });
  });

  it("focuses initialFocusRef when provided and enabled", async () => {
    function InitialFocusHarness() {
      const preferredRef = useRef<HTMLButtonElement>(null);
      return (
        <FocusTrap active={true} initialFocusRef={preferredRef}>
          <button>First</button>
          <button ref={preferredRef}>Preferred</button>
          <button>Last</button>
        </FocusTrap>
      );
    }

    render(<InitialFocusHarness />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Preferred" })).toHaveFocus();
    });
  });

  it("falls back to first enabled element if initialFocusRef target is disabled", async () => {
    function DisabledInitialFocusHarness() {
      const preferredRef = useRef<HTMLButtonElement>(null);
      return (
        <FocusTrap active={true} initialFocusRef={preferredRef}>
          <button>First</button>
          <button ref={preferredRef} disabled>
            Disabled Preferred
          </button>
        </FocusTrap>
      );
    }

    render(<DisabledInitialFocusHarness />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "First" })).toHaveFocus();
    });
  });

  it("wraps Tab and Shift+Tab across the enabled button set", async () => {
    render(
      <FocusTrap active={true}>
        <button>First</button>
        <button disabled>Disabled Middle</button>
        <button>Second</button>
        <button>Third</button>
      </FocusTrap>
    );

    const first = screen.getByRole("button", { name: "First" });
    const second = screen.getByRole("button", { name: "Second" });
    const third = screen.getByRole("button", { name: "Third" });

    await waitFor(() => expect(first).toHaveFocus());

    // Tab from first -> second (skipping disabled middle)
    await userEvent.tab();
    expect(second).toHaveFocus();

    // Tab from second -> third
    await userEvent.tab();
    expect(third).toHaveFocus();

    // Tab from last enabled element wraps to first
    await userEvent.tab();
    expect(first).toHaveFocus();

    // Shift+Tab from first wraps back to last enabled
    await userEvent.tab({ shift: true });
    expect(third).toHaveFocus();
  });

  it("reflects dynamically added and removed controls in subsequent traversal", async () => {
    function DynamicControlsHarness() {
      const [showExtra, setShowExtra] = useState(false);
      return (
        <FocusTrap active={true}>
          <button>First</button>
          <button onClick={() => setShowExtra((prev) => !prev)}>Toggle</button>
          {showExtra && <button>Dynamic Extra</button>}
          <button>Last</button>
        </FocusTrap>
      );
    }

    render(<DynamicControlsHarness />);
    const first = screen.getByRole("button", { name: "First" });
    const toggle = screen.getByRole("button", { name: "Toggle" });
    const last = screen.getByRole("button", { name: "Last" });

    await waitFor(() => expect(first).toHaveFocus());

    // Initially: First -> Toggle -> Last -> First
    await userEvent.tab();
    expect(toggle).toHaveFocus();
    await userEvent.click(toggle);

    // Dynamic button is now in the DOM
    const extra = screen.getByRole("button", { name: "Dynamic Extra" });
    expect(extra).toBeInTheDocument();

    // Tab from Toggle -> Dynamic Extra
    await userEvent.tab();
    expect(extra).toHaveFocus();

    // Tab from Dynamic Extra -> Last
    await userEvent.tab();
    expect(last).toHaveFocus();

    // Tab from Last wraps to First
    await userEvent.tab();
    expect(first).toHaveFocus();

    // Shift+Tab from First wraps to Last
    await userEvent.tab({ shift: true });
    expect(last).toHaveFocus();

    // Now remove dynamic control
    await userEvent.click(toggle);
    expect(screen.queryByRole("button", { name: "Dynamic Extra" })).not.toBeInTheDocument();

    // Traversal now wraps cleanly without the removed element
    last.focus();
    await userEvent.tab();
    expect(first).toHaveFocus();
  });

  it("skips controls when they dynamically become disabled", async () => {
    function DisablingHarness() {
      const [isSecondDisabled, setIsSecondDisabled] = useState(false);
      return (
        <FocusTrap active={true}>
          <button>First</button>
          <button disabled={isSecondDisabled}>Second</button>
          <button onClick={() => setIsSecondDisabled(true)}>Disable Second</button>
        </FocusTrap>
      );
    }

    render(<DisablingHarness />);
    const first = screen.getByRole("button", { name: "First" });
    const second = screen.getByRole("button", { name: "Second" });
    const disableBtn = screen.getByRole("button", { name: "Disable Second" });

    await waitFor(() => expect(first).toHaveFocus());

    await userEvent.click(disableBtn);
    expect(second).toBeDisabled();

    // First -> Disable Second -> Wraps to First (skipping disabled second)
    first.focus();
    await userEvent.tab();
    expect(disableBtn).toHaveFocus();

    await userEvent.tab();
    expect(first).toHaveFocus();
  });

  it("triggers onEscape when Escape key is pressed", async () => {
    const onEscape = vi.fn();
    render(
      <FocusTrap active={true} onEscape={onEscape}>
        <button>Inside</button>
      </FocusTrap>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Inside" })).toHaveFocus();
    });

    await userEvent.keyboard("{Escape}");
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("does not call onEscape when active is false", async () => {
    const onEscape = vi.fn();
    render(
      <FocusTrap active={false} onEscape={onEscape}>
        <button>Inside</button>
      </FocusTrap>
    );

    const inside = screen.getByRole("button", { name: "Inside" });
    inside.focus();
    await userEvent.keyboard("{Escape}");

    expect(onEscape).not.toHaveBeenCalled();
  });

  it("restores focus to previously active element on deactivation", async () => {
    function RestorationHarness() {
      const [active, setActive] = useState(false);
      return (
        <div>
          <button onClick={() => setActive(true)}>Open Modal</button>
          <FocusTrap active={active} onEscape={() => setActive(false)}>
            <button>Modal Action</button>
            <button onClick={() => setActive(false)}>Close</button>
          </FocusTrap>
        </div>
      );
    }

    render(<RestorationHarness />);
    const trigger = screen.getByRole("button", { name: "Open Modal" });
    trigger.focus();
    expect(trigger).toHaveFocus();

    await userEvent.click(trigger);
    const modalAction = screen.getByRole("button", { name: "Modal Action" });
    await waitFor(() => expect(modalAction).toHaveFocus());

    // Trigger close
    const closeBtn = screen.getByRole("button", { name: "Close" });
    await userEvent.click(closeBtn);

    // Trigger button should receive focus back
    await waitFor(() => expect(trigger).toHaveFocus());
  });
});

describe("useFocusTrap hook behavioral tests", () => {
  function HookHarness({
    isActive,
    autoFocus = false,
    onEscape,
  }: {
    isActive: boolean;
    autoFocus?: boolean;
    onEscape?: () => void;
  }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [extra, setExtra] = useState(false);
    useFocusTrap(containerRef, isActive, { autoFocus, onEscape });

    return (
      <div ref={containerRef}>
        <button>Hook Btn 1</button>
        <button onClick={() => setExtra((p) => !p)}>Toggle Hook Extra</button>
        {extra && <button>Hook Extra</button>}
        <button>Hook Btn 2</button>
      </div>
    );
  }

  it("traps Tab and Shift+Tab wraparound inside container", async () => {
    render(<HookHarness isActive={true} autoFocus={true} />);

    const btn1 = screen.getByRole("button", { name: "Hook Btn 1" });
    const toggle = screen.getByRole("button", { name: "Hook Btn 2" });

    // autoFocus places focus on first element
    expect(btn1).toHaveFocus();

    // Focus last element
    toggle.focus();
    expect(toggle).toHaveFocus();

    // Tab wraps to first
    await userEvent.tab();
    expect(btn1).toHaveFocus();

    // Shift+Tab from first wraps to last
    await userEvent.tab({ shift: true });
    expect(toggle).toHaveFocus();
  });

  it("handles dynamically added controls in hook traversal", async () => {
    render(<HookHarness isActive={true} autoFocus={true} />);

    const toggleBtn = screen.getByRole("button", { name: "Toggle Hook Extra" });
    await userEvent.click(toggleBtn);

    const extraBtn = screen.getByRole("button", { name: "Hook Extra" });
    const lastBtn = screen.getByRole("button", { name: "Hook Btn 2" });

    extraBtn.focus();
    await userEvent.tab();
    expect(lastBtn).toHaveFocus();
  });

  it("calls onEscape when Escape key is pressed", async () => {
    const onEscape = vi.fn();
    render(<HookHarness isActive={true} onEscape={onEscape} />);

    const btn1 = screen.getByRole("button", { name: "Hook Btn 1" });
    btn1.focus();

    await userEvent.keyboard("{Escape}");
    expect(onEscape).toHaveBeenCalledTimes(1);
  });

  it("does not promise or perform focus restoration upon deactivation (hook contract difference)", async () => {
    function HookRestorationHarness() {
      const [active, setActive] = useState(false);
      return (
        <div>
          <button onClick={() => setActive(true)}>Trigger</button>
          {active && <HookHarness isActive={active} autoFocus={true} />}
          {active && <button onClick={() => setActive(false)}>Deactivate</button>}
        </div>
      );
    }

    render(<HookRestorationHarness />);
    const trigger = screen.getByRole("button", { name: "Trigger" });
    await userEvent.click(trigger);

    const deactivate = screen.getByRole("button", { name: "Deactivate" });
    await userEvent.click(deactivate);

    // Unlike FocusTrap component, useFocusTrap does not restore focus to the trigger
    expect(trigger).not.toHaveFocus();
  });
});
