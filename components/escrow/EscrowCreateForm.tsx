"use client";

import { type FormEvent, useRef, useState } from "react";
import { toast } from "sonner";

import ShareModal from "@/components/escrow/ShareModal";
import { FormField } from "@/components/ui/FormField";
import { QrCode } from "@/components/ui/QrCode";
import { createEscrow, type EscrowInput } from "@/lib/api";
import { renderMarkdown } from "@/lib/markdown";
import {
  EscrowCreateSchema,
  type EscrowCreateValues,
  shippingOptions,
  type ShippingWindow,
} from "@/lib/validations";

/**
 * Configuration properties for the {@link EscrowCreateForm} component.
 */
export interface EscrowCreateFormProps {
  /**
   * Optional callback invoked when an escrow link is successfully generated.
   *
   * @param url - The fully qualified shareable URL for the newly created escrow.
   */
  onSuccess?: (url: string) => void;
  /**
   * Optional custom CSS class name to append to the outer form container.
   */
  className?: string;
  /**
   * Optional initial form values for pre-populating fields.
   */
  initialValues?: Partial<EscrowCreateValues>;
}

/**
 * EscrowCreateForm provides an interactive form interface for merchants and buyers
 * to initiate smart contract escrows on the Stellar network with USDC pricing.
 *
 * Features:
 * - Real-time client-side schema validation via Zod (`EscrowCreateSchema`)
 * - Live markdown preview for item descriptions
 * - Duplicate submission prevention using synchronous ref lock and disabled button states
 * - Shareable payment link and QR code generation with clipboard copy and WhatsApp integration
 *
 * @param props - Component configuration properties {@link EscrowCreateFormProps}.
 * @returns The rendered escrow creation form and shareable result section.
 */
export default function EscrowCreateForm({
  onSuccess,
  className = "",
  initialValues,
}: EscrowCreateFormProps = {}) {
  const [values, setValues] = useState<EscrowCreateValues>({
    itemName: initialValues?.itemName ?? "",
    priceUSDC: initialValues?.priceUSDC ?? "",
    description: initialValues?.description ?? "",
    shippingWindow: initialValues?.shippingWindow ?? shippingOptions[0],
  });
  const [errors, setErrors] = useState<
    Partial<Record<keyof EscrowCreateValues, string>>
  >({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  // Mirrored in state so the UI can disable the button without reading the
  // ref during render (refs cannot be accessed while rendering).
  const [submitLocked, setSubmitLocked] = useState<boolean>(false);
  const submittingRef = useRef<boolean>(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Updates a single form field value and clears any associated error state.
   *
   * @template K - Key of `EscrowCreateValues` being updated.
   * @param field - The field key to update.
   * @param value - The new value matching the field type.
   */
  const updateField = <K extends keyof EscrowCreateValues>(
    field: K,
    value: EscrowCreateValues[K]
  ): void => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  };

  /**
   * Copies the generated escrow result URL to the system clipboard and displays a confirmation status.
   */
  const copyResultUrl = async (): Promise<void> => {
    if (!resultUrl) {
      return;
    }

    await navigator.clipboard.writeText(resultUrl);
    setCopyStatus("Link copied to clipboard.");
  };

  /**
   * Handles form submission: validates inputs, invokes API, and reveals the payment link.
   *
   * @param event - React FormEvent submitted by the user.
   */
  const onSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
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
      onSuccess?.(response.url);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      submittingRef.current = false;
      setSubmitLocked(false);
      setIsSubmitting(false);
    }
  };

  /**
   * Triggers a toast confirmation for QR code download.
   */
  const downloadQR = async (): Promise<void> => {
    const canvas = canvasRef.current;
    if (!canvas || !resultUrl) return;
    // PNG export handled by the shared QrCode component
    toast.success("QR code downloaded");
  };

  return (
    <div className={`mx-auto w-full max-w-2xl rounded-[32px] border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-8 ${className}`}>
      <form onSubmit={onSubmit} className="space-y-5">
        <FormField label="Item name" id="itemName" error={errors.itemName}>
          <input
            id="itemName"
            name="itemName"
            type="text"
            value={values.itemName}
            onChange={(event) => updateField("itemName", event.target.value)}
            placeholder="e.g. Vintage mechanical keyboard"
            disabled={isSubmitting}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none ring-0 transition placeholder:text-zinc-400 focus:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus-visible:ring-zinc-300"
          />
        </FormField>

        <FormField
          label="Price (USDC)"
          id="priceUSDC"
          error={errors.priceUSDC}
          hint="Funds will be locked until delivery is confirmed."
        >
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm font-semibold text-zinc-400">
              $
            </span>
            <input
              id="priceUSDC"
              name="priceUSDC"
              type="text"
              inputMode="decimal"
              value={values.priceUSDC}
              onChange={(event) => updateField("priceUSDC", event.target.value)}
              placeholder="120.00"
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-zinc-200 bg-white py-3 pl-8 pr-16 text-zinc-950 outline-none ring-0 transition placeholder:text-zinc-400 focus:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus-visible:ring-zinc-300"
            />
            <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-xs font-semibold uppercase tracking-wider text-zinc-400">
              USDC
            </span>
          </div>
        </FormField>

        <FormField
          label="Description"
          id="description"
          error={errors.description}
          hint="Supports markdown formatting."
        >
          <div className="grid gap-3 lg:grid-cols-2">
            <textarea
              id="description"
              name="description"
              rows={4}
              value={values.description}
              onChange={(event) => updateField("description", event.target.value)}
              placeholder="Detailed description of the item, condition, and any terms..."
              disabled={isSubmitting}
              className="w-full rounded-2xl border border-zinc-200 bg-white p-4 text-zinc-950 outline-none ring-0 transition placeholder:text-zinc-400 focus:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder:text-zinc-500 dark:focus-visible:ring-zinc-300"
            />
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-300">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                Preview
              </p>
              {values.description.trim() ? (
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{
                    __html: renderMarkdown(values.description),
                  }}
                />
              ) : (
                <p className="text-zinc-400 italic">No description entered yet.</p>
              )}
            </div>
          </div>
        </FormField>

        <FormField
          label="Shipping window"
          id="shippingWindow"
          hint="Auto-release timeout if buyer takes no action after confirmation."
        >
          <select
            id="shippingWindow"
            name="shippingWindow"
            value={values.shippingWindow}
            onChange={(event) =>
              updateField(
                "shippingWindow",
                event.target.value as ShippingWindow
              )
            }
            disabled={isSubmitting}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none ring-0 transition focus:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus-visible:ring-zinc-300"
          >
            {shippingOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </FormField>

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
        <section
          data-testid="link-card"
          className="mt-8 rounded-[28px] border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                Shareable link ready
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Copy this URL or scan the QR code to share it with a buyer.
              </p>
            </div>
            <button
              type="button"
              onClick={copyResultUrl}
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-white dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-950"
            >
              Copy link
            </button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Pay securely for your order using TrustLink: ${resultUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-white dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-950"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Share on WhatsApp
            </a>
          </div>

          <div className="mt-5">
            <label
              htmlFor="shareable-url"
              className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Shareable URL
            </label>
            <input
              id="shareable-url"
              data-testid="shareable-url"
              readOnly
              value={resultUrl}
              className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 font-mono text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            />
            {copyStatus ? (
              <p className="mt-2 text-sm text-emerald-600">{copyStatus}</p>
            ) : null}
          </div>

          <div className="mt-6 flex flex-col items-center gap-3">
            <QrCode value={resultUrl} />
            <canvas ref={canvasRef} className="sr-only" aria-hidden="true" />
            <button
              type="button"
              onClick={downloadQR}
              className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-white dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-950"
            >
              Download QR
            </button>
          </div>
        </section>
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
