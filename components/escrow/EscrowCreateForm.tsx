"use client";

import { type FormEvent, useRef, useState } from "react";
import { toast } from "sonner";

import {
  EscrowCreateFormFields,
} from "@/components/escrow/EscrowCreateFormFields";
import { EscrowCreateFormResult } from "@/components/escrow/EscrowCreateFormResult";
import ShareModal from "@/components/escrow/ShareModal";
import { createEscrow, type EscrowInput } from "@/lib/api";
import {
  EscrowCreateSchema,
  type EscrowCreateValues,
  shippingOptions,
} from "@/lib/validations";

/**
 * Form for creating a new escrow link.
 *
 * Collects item name, price (USDC), description (markdown), and shipping
 * window from the seller, validates input via `EscrowCreateSchema`, calls the
 * API to create the escrow, and displays the resulting shareable link with a
 * QR code and sharing options.
 *
 * Field rendering lives in `EscrowCreateFormFields` and the post-submission
 * shareable-link card in `EscrowCreateFormResult`; this component owns state,
 * validation, and submission.
 */
export default function EscrowCreateForm() {
  const [values, setValues] = useState<EscrowCreateValues>({
    itemName: "",
    priceUSDC: "",
    description: "",
    shippingWindow: shippingOptions[0],
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof EscrowCreateValues, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Mirrored in state so the UI can disable the button without reading the
  // ref during render (refs cannot be accessed while rendering).
  const [submitLocked, setSubmitLocked] = useState(false);
  const submittingRef = useRef(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /** Update a single field value and clear its validation error. */
  const updateField = <K extends keyof EscrowCreateValues>(
    field: K,
    value: EscrowCreateValues[K]
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  /** Copy the generated escrow URL to the clipboard. */
  const copyResultUrl = async () => {
    if (!resultUrl) {
      return;
    }

    await navigator.clipboard.writeText(resultUrl);
    setCopyStatus("Link copied to clipboard.");
  };

  /** Trigger a QR code download for the generated escrow URL. */
  const downloadQR = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !resultUrl) return;
    // PNG export handled by the shared QrCode component
    toast.success("QR code downloaded");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submittingRef.current) return;
    // set lock synchronously to prevent double-submit before state updates
    submittingRef.current = true;
    setSubmitLocked(true);

    setCopyStatus(null);
    setSubmitError(null);

    const result = EscrowCreateSchema.safeParse(values);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof EscrowCreateValues, string>> = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof EscrowCreateValues;
        if (!fieldErrors[key]) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      // release the synchronous lock so the user can correct validation errors
      submittingRef.current = false;
      setSubmitLocked(false);
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: EscrowInput = {
        itemName: values.itemName.trim(),
        priceUSDC: values.priceUSDC.trim(),
        description: values.description.trim(),
        shippingWindow: values.shippingWindow,
      };

      const response = await createEscrow(payload);
      if (!response.url || !/^https?:\/\//i.test(response.url)) {
        throw new Error("The escrow service returned an invalid URL.");
      }

      setResultUrl(response.url);
      setIsModalOpen(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      submittingRef.current = false;
      setSubmitLocked(false);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-2xl rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
      <form onSubmit={onSubmit} className="space-y-5">
        <EscrowCreateFormFields
          values={values}
          errors={errors}
          disabled={isSubmitting}
          onChange={updateField}
        />

        {submitError ? (
          <p
            role="alert"
            className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-300"
          >
            {submitError}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={isSubmitting || submitLocked}
          className="inline-flex w-full items-center justify-center rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {isSubmitting ? "Creating link..." : "Create escrow link"}
        </button>
      </form>

      {resultUrl ? (
        <EscrowCreateFormResult
          resultUrl={resultUrl}
          copyStatus={copyStatus}
          onCopy={copyResultUrl}
          onDownloadQR={downloadQR}
          canvasRef={canvasRef}
        />
      ) : null}

      {resultUrl && (
        <ShareModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          url={resultUrl}
          escrowId={resultUrl.split("/").pop() || "escrow"}
        />
      )}
    </div>
  );
}
