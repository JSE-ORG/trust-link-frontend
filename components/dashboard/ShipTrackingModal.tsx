"use client";

import React, { useState, FormEvent, useEffect, useRef } from "react";

interface ShipTrackingModalProps {
  escrowId: string;
  vendorName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: (escrowId: string) => void;
}

export default function ShipTrackingModal({
  escrowId,
  vendorName,
  open,
  onClose,
  onSuccess,
}: ShipTrackingModalProps) {
  const [trackingId, setTrackingId] = useState("");
  const [carrier, setCarrier] = useState("Terminal Africa");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Close on Escape & Trap Focus
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll(
          'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0] as HTMLElement;
        const last = focusable[focusable.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    }
    if (open) {
      document.addEventListener("keydown", onKey);
      // Auto-focus first element
      const first = modalRef.current?.querySelector('button, input, select') as HTMLElement;
      first?.focus();
    }
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTrackingId = trackingId.trim();
    if (!trimmedTrackingId) {
      setError("Tracking ID is required.");
      return;
    }

    if (trimmedTrackingId.length > 64) {
      setError("Tracking ID must be 64 characters or less.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/escrow/${escrowId}/ship`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ trackingId: trimmedTrackingId, carrier }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message ?? "Unable to submit shipment details.");
      }

      onSuccess(escrowId);
      onClose();
      setTrackingId("");
      setCarrier("Terminal Africa");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Failed to submit tracking details."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 backdrop-blur-sm sm:items-center">
      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        className="w-full max-w-xl overflow-hidden rounded-[2rem] bg-white p-6 shadow-2xl dark:bg-zinc-950 dark:text-white"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-100">Mark shipment as shipped</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Add tracking details for {vendorName} so the escrow can be updated.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/5 dark:hover:text-white"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="trackingId" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Tracking ID
            </label>
            <input
              id="trackingId"
              value={trackingId}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTrackingId(event.target.value)}
              maxLength={64}
              required
              className="mt-2 w-full rounded-3xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
              placeholder="Enter tracking ID"
            />
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Required, max 64 characters.</p>
          </div>

          <div>
            <label htmlFor="carrier" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Logistics carrier
            </label>
            <select
              id="carrier"
              value={carrier}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setCarrier(event.target.value)}
              className="mt-2 w-full rounded-3xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100"
            >
              <option>Terminal Africa</option>
              <option>GIGL</option>
              <option>Other</option>
            </select>
          </div>

          {error ? (
            <div className="rounded-3xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-3xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-3xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
