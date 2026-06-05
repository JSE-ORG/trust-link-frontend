"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import useWallet from "@/hooks/useWallet";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface ConfirmDeliveryButtonProps {
  escrowId: string;
  onSuccess: () => void;
}

export function ConfirmDeliveryButton({
  escrowId,
  onSuccess,
}: ConfirmDeliveryButtonProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, setIsPending] = useState(false);
  const { token } = useWallet();

  function openDialog() {
    dialogRef.current?.showModal();
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  async function handleConfirm() {
    setIsPending(true);
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/escrows/${escrowId}/confirm`, {
        method: "POST",
        headers,
      });

      if (!res.ok) throw new Error("Failed to confirm delivery");

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
        onClick={openDialog}
        className="flex-1 rounded-2xl bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800"
      >
        Confirm Delivery
      </button>

      <dialog
        ref={dialogRef}
        className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl backdrop:bg-black/50 dark:border-zinc-700 dark:bg-zinc-900"
        onCancel={closeDialog}
      >
        <h2 className="mb-2 text-lg font-semibold text-zinc-950 dark:text-zinc-100">
          Confirm Delivery
        </h2>
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          Confirm you received your order? This will release funds to the
          vendor.
        </p>
        <div className="flex gap-3">
          <button
            onClick={closeDialog}
            disabled={isPending}
            className="flex-1 rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isPending}
            className="flex-1 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-800"
          >
            {isPending ? "Confirming…" : "Yes, confirm"}
          </button>
        </div>
      </dialog>
    </>
  );
}
