"use client";

import React, { FormEvent, useRef,useState } from "react";
import { useTranslation } from "react-i18next";

import { useFocusTrap } from "@/hooks/useFocusTrap";
import { shipEscrow } from "@/lib/api";

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
  const { t } = useTranslation();
  const [trackingId, setTrackingId] = useState("");
  const [carrier, setCarrier] = useState("Terminal Africa");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);

  useFocusTrap(modalRef, open, { onEscape: onClose, autoFocus: true });

  if (!open) {
    return null;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedTrackingId = trackingId.trim();
    if (!trimmedTrackingId) {
      setError(t("dashboard.shipment.trackingIdRequired"));
      return;
    }

    if (trimmedTrackingId.length > 64) {
      setError(t("dashboard.shipment.trackingIdTooLong"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await shipEscrow(escrowId, {
        trackingId: trimmedTrackingId,
        carrier: carrier,
      });

      onSuccess(escrowId);
      onClose();
      setTrackingId("");
      setCarrier("Terminal Africa");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : t("dashboard.shipment.submitError")
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
            <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-100">{t("dashboard.shipment.title")}</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {t("dashboard.shipment.description", { vendorName })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:hover:bg-white/5 dark:hover:text-white dark:focus-visible:ring-zinc-300"
            aria-label={t("dashboard.shipment.closeModal")}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="trackingId" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("dashboard.shipment.trackingId")}
            </label>
            <input
              id="trackingId"
              value={trackingId}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => setTrackingId(event.target.value)}
              maxLength={64}
              required
              aria-invalid={!!error}
              aria-describedby={error ? "tracking-error" : "tracking-hint"}
              className="mt-2 w-full rounded-3xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:ring-zinc-300"
              placeholder={t("dashboard.shipment.trackingIdPlaceholder")}
            />
            <p id="tracking-hint" className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{t("dashboard.shipment.trackingIdHint")}</p>
          </div>

          <div>
            <label htmlFor="carrier" className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              {t("dashboard.shipment.carrier")}
            </label>
            <select
              id="carrier"
              value={carrier}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setCarrier(event.target.value)}
              className="mt-2 w-full rounded-3xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus-visible:ring-zinc-300"
            >
              <option value="Terminal Africa">{t("dashboard.shipment.terminalAfrica")}</option>
              <option value="GIGL">{t("dashboard.shipment.gigl")}</option>
              <option value="Other">{t("dashboard.shipment.otherCarrier")}</option>
            </select>
          </div>

          {error ? (
            <div id="tracking-error" role="alert" className="rounded-3xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-200">
              {error}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-3xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-900 dark:focus-visible:ring-zinc-300"
            >
              {t("dashboard.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-3xl bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? t("dashboard.shipment.submitting") : t("dashboard.shipment.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
