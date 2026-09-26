import type { RefObject } from "react";
import { useEffect } from "react";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

interface UseFocusTrapOptions {
  onEscape?: () => void;
  autoFocus?: boolean;
}

/** Keeps keyboard focus inside an active dialog-like container. */
export function useFocusTrap(
  ref: RefObject<HTMLElement | null>,
  isActive: boolean,
  { onEscape, autoFocus = false }: UseFocusTrapOptions = {}
) {
  useEffect(() => {
    if (!isActive) return;

    const container = ref.current;
    const focusable = () =>
      Array.from(container?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? []);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onEscape?.();
        return;
      }

      if (event.key !== "Tab") return;

      const elements = focusable();
      const first = elements[0];
      const last = elements.at(-1);
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        last.focus();
        event.preventDefault();
      } else if (!event.shiftKey && document.activeElement === last) {
        first.focus();
        event.preventDefault();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    if (autoFocus) focusable()[0]?.focus();

    return () => document.removeEventListener("keydown", onKeyDown);
  }, [autoFocus, isActive, onEscape, ref]);
}
