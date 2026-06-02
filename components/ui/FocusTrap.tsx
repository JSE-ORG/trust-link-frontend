"use client";

import {
  useEffect,
  useRef,
  type ReactNode,
  type KeyboardEvent,
} from "react";

// All standard HTML elements that can receive keyboard focus.
const FOCUSABLE_SELECTORS = [
  "a[href]",
  "area[href]",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "button:not([disabled])",
  "iframe",
  "object",
  "embed",
  "[contenteditable]",
  "[tabindex]:not([tabindex='-1'])",
].join(", ");

export interface FocusTrapProps {
  /** Whether the trap is currently active. When false, the component renders
   *  its children normally without intercepting focus. */
  active: boolean;
  /** Called when the user presses Escape. Typically closes the modal. */
  onEscape?: () => void;
  children: ReactNode;
  /** Optional className forwarded to the wrapping div. */
  className?: string;
}

/**
 * FocusTrap — reusable focus-trap for modals and dialogs (issue #107).
 *
 * When `active` is true:
 * - Focuses the first focusable child on mount.
 * - Traps Tab / Shift+Tab so focus cycles within the container.
 * - Calls `onEscape` when the Escape key is pressed.
 * - Returns focus to the element that was focused before the trap activated.
 *
 * Usage:
 * ```tsx
 * <FocusTrap active={isOpen} onEscape={() => setIsOpen(false)}>
 *   <dialog role="dialog" aria-modal>
 *     …modal content…
 *   </dialog>
 * </FocusTrap>
 * ```
 */
export default function FocusTrap({
  active,
  onEscape,
  children,
  className,
}: FocusTrapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Remember which element had focus before the trap activated so we can
  // restore it when the trap deactivates.
  const previousFocusRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!active) return;

    // Save the currently focused element so we can restore it later.
    previousFocusRef.current = document.activeElement;

    // Move focus into the trap on the next tick so the DOM is fully painted.
    const frame = requestAnimationFrame(() => {
      const first = getFocusableElements(containerRef.current)[0];
      first?.focus();
    });

    return () => {
      cancelAnimationFrame(frame);
      // Restore focus to the previously focused element when trap deactivates.
      if (
        previousFocusRef.current instanceof HTMLElement ||
        previousFocusRef.current instanceof SVGElement
      ) {
        previousFocusRef.current.focus();
      }
    };
  }, [active]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!active) return;

    if (e.key === "Escape") {
      e.preventDefault();
      onEscape?.();
      return;
    }

    if (e.key !== "Tab") return;

    const focusable = getFocusableElements(containerRef.current);
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (e.shiftKey) {
      // Shift+Tab: if focus is on the first element, wrap to the last.
      if (active === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      // Tab: if focus is on the last element, wrap to the first.
      if (active === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={className}
      // Ensure the container itself is not in the natural tab order.
      tabIndex={-1}
      style={{ outline: "none" }}
    >
      {children}
    </div>
  );
}

// ── helpers ───────────────────────────────────────────────────────────────────

function getFocusableElements(
  container: HTMLElement | null
): HTMLElement[] {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
  ).filter((el) => !el.closest("[aria-hidden='true']"));
}
