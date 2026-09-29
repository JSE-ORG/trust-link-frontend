"use client";

import { type KeyboardEvent, useState } from "react";
import { toast } from "sonner";

import FocusTrap from "@/components/ui/FocusTrap";
import useWallet from "@/hooks/useWallet";
import { createApiClient } from "@/lib/api-client";
import type { ApiErrorResponse } from "@/types/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Props for the ConfirmDeliveryButton component.
 */
interface ConfirmDeliveryButtonProps {
  /** Identifier of the escrow whose delivery is being confirmed. Sent to the
   *  `/escrows/:id/confirm` endpoint. */
  escrowId: string;
  /** Called once the API has accepted the confirmation, so the parent can
   *  refetch the escrow and move it out of the awaiting-delivery state. */
  onSuccess: () => void;
}

/** Request headers for the confirm call. `Record<string, string>` rather than
 *  the DOM's `HeadersInit` union, which cannot be indexed by header name. */
type ConfirmHeaders = Record<string, string>;

/**
 * Builds a keydown handler that mirrors the control's click behaviour for
 * Enter and Space, so the confirmation flow stays reachable for keyboard-only
 * users even if the control is later rendered through a custom element.
 *
 * @param activate - The action to run when Enter or Space is pressed.
 * @returns A keydown handler that runs `activate` and suppresses the native
 *          activation (page scroll on Space) that would otherwise double-fire.
 */
function activateOnKey(activate: () => void) {
  return (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      activate();
    }
  };
}

/**
 * ConfirmDeliveryButton
 *
 * Buyer-side control that releases escrow funds once the goods have arrived.
 * Renders a trigger button; clicking it opens a modal confirmation dialog
 * (focus-trapped, dismissible with Escape or Cancel) which posts the
 * confirmation and reports the outcome through a toast. Both dialog controls
 * are disabled and the primary button switches to a pending label while the
 * request is in flight, so the release cannot be double-submitted.
 *
 * @param props - Component properties.
 * @returns The trigger button, plus the confirmation dialog while it is open.
 */
export function ConfirmDeliveryButton({
  escrowId,
  onSuccess,
}: ConfirmDeliveryButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { token } = useWallet();

  /** Opens the confirmation dialog. */
  function openDialog() {
    setIsOpen(true);
  }

  /** Closes the confirmation dialog without confirming. */
  function closeDialog() {
    setIsOpen(false);
  }

  /**
   * Releases the escrow funds. Posts the confirmation, closes the dialog and
   * hands back to the parent on success; on failure the dialog stays open and
   * the server's message (or a generic fallback) is surfaced as an error toast.
   */
  async function handleConfirm() {
    setIsPending(true);
    try {
      const headers: ConfirmHeaders = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const api = createApiClient({ token });
      await api.post(`/escrows/${escrowId}/confirm`);

      const res = await fetch(`${API_URL}/escrows/${escrowId}/confirm`, {
        method: "POST",
        headers,
      });

      if (!res.ok) {
        const payload = (await res
          .json()
          .catch(() => null)) as ApiErrorResponse | null;
        throw new Error(payload?.message ?? "Failed to confirm delivery");
      }

      closeDialog();
      toast.success("Delivery confirmed — funds released.");
      onSuccess();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Could not confirm delivery"
      );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        onKeyDown={activateOnKey(openDialog)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className="flex-1 rounded-2xl bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 dark:bg-green-700 dark:hover:bg-green-800"
      >
        Confirm Delivery
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <FocusTrap active={isOpen} onEscape={closeDialog}>
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="confirm-dialog-title"
              className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            >
              <h2
                id="confirm-dialog-title"
                className="mb-2 text-lg font-semibold text-zinc-950 dark:text-zinc-100"
              >
                Confirm Delivery
              </h2>
              <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
                Confirm you received your order? This will release funds to the
                vendor.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeDialog}
                  onKeyDown={activateOnKey(closeDialog)}
                  disabled={isPending}
                  className="flex-1 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  onKeyDown={activateOnKey(handleConfirm)}
                  disabled={isPending}
                  className="flex-1 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-800"
                >
                  {isPending ? "Confirming…" : "Yes, confirm"}
                </button>
              </div>
            </div>
          </FocusTrap>
        </div>
      )}
    </>
  );
}
