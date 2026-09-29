"use client";

import {
  type KeyboardEvent,
  type ReactNode,
  type RefObject,
  useEffect,
  useRef,
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
  /** Optional ref to an element that should receive focus when the trap
   *  activates, instead of the first focusable element in the container.
   *  Useful when a specific action (e.g. the primary/confirm button) should
   *  be focused rather than whichever element happens to be first in the
   *  DOM. */
  initialFocusRef?: RefObject<HTMLElement | null>;
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
  initialFocusRef,
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
      const preferred = initialFocusRef?.current;
      if (preferred && !preferred.hasAttribute("disabled")) {
        preferred.focus();
        return;
      }
      const first = getFocusableElements(containerRef.current)[0];
      first?.focus();
    });

    // Listen for Escape at the document level rather than relying on focus
    // being inside the trap. Initial focus-in happens on the next animation
    // frame (above), so a keydown handler scoped to the container alone
    // would miss an Escape pressed before that frame fires.
    const onDocumentKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onEscape?.();
      }
    };
    document.addEventListener("keydown", onDocumentKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onDocumentKeyDown);
      // Restore focus to the previously focused element when trap deactivates.
      if (
        previousFocusRef.current instanceof HTMLElement ||
        previousFocusRef.current instanceof SVGElement
      ) {
        previousFocusRef.current.focus();
      }
    };
  }, [active, initialFocusRef, onEscape]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!active) return;

    if (e.key !== "Tab") return;

    const focusable = getFocusableElements(containerRef.current);
    if (focusable.length === 0) {
      e.preventDefault();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    // Use a distinct variable name to avoid shadowing the `active` prop,
    // which would create a Temporal Dead Zone and throw a ReferenceError
    // before the `const` binding is initialised.
    const focused = document.activeElement;

    if (e.shiftKey) {
      // Shift+Tab: if focus is on the first element, wrap to the last.
      if (focused === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (focused === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      className={className ? `${className} outline-none` : "outline-none"}
      // Ensure the container itself is not in the natural tab order.
      tabIndex={-1}
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
