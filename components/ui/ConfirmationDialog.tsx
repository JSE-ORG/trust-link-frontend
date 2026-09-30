"use client";

import { type ReactNode, useRef } from "react";

import FocusTrap from "./FocusTrap";

export interface ConfirmationDialogProps {
  /** Controls visibility. When false, nothing is rendered. */
  open: boolean;
  /** Heading shown at the top of the dialog. */
  title: string;
  /** Body content — plain string or arbitrary nodes. */
  description?: ReactNode;
  /** Label for the confirm action. Defaults to "Confirm". */
  confirmLabel?: string;
  /** Label for the cancel action. Defaults to "Cancel". */
  cancelLabel?: string;
  /** Called when the user confirms. */
  onConfirm: () => void;
  /** Called when the user cancels (button, backdrop, or Escape). */
  onCancel: () => void;
  /** Visual treatment of the confirm button. */
  variant?: "default" | "danger";
  /** Disables the confirm button and shows a pending label. */
  loading?: boolean;
}

const confirmVariantClasses: Record<string, string> = {
  default:
    "bg-black text-white hover:bg-zinc-900 dark:bg-white dark:text-black dark:hover:bg-zinc-200",
  danger:
    "bg-red-600 text-white hover:bg-red-700 dark:bg-red-600 dark:text-white dark:hover:bg-red-500",
};

/**
 * Reusable confirmation dialog (issue #68/#69).
 *
 * Accepts a custom title, body, and confirm/cancel handlers. Closes on
 * backdrop click and the Escape key, and is accessible via role="dialog"
 * with aria-modal and a labelled heading. Focus is trapped inside the
 * dialog while open (via `FocusTrap`, issue #566) and restored to the
 * triggering element on close.
 */
export default function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  variant = "default",
  loading = false,
}: ConfirmationDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center"
      onClick={onCancel}
    >
      <FocusTrap active={open} onEscape={onCancel} initialFocusRef={confirmRef}>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmation-dialog-title"
          aria-describedby={description ? "confirmation-dialog-body" : undefined}
          className="w-full max-w-md overflow-hidden rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-zinc-950 dark:text-white"
          onClick={(event) => event.stopPropagation()}
        >
          <h2
            id="confirmation-dialog-title"
            className="text-xl font-semibold text-zinc-950 dark:text-zinc-100"
          >
            {title}
          </h2>

          {description ? (
            <div
              id="confirmation-dialog-body"
              className="mt-2 text-sm text-zinc-600 dark:text-zinc-400"
            >
              {description}
            </div>
          ) : null}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="rounded-3xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className={`rounded-3xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${confirmVariantClasses[variant]}`}
            >
              {loading ? "Please wait..." : confirmLabel}
            </button>
          </div>
        </div>
      </FocusTrap>
    </div>
  );
}