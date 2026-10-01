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
  /** Update a single field value and clear its validation error. */
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
  /** Copy the generated escrow URL to the clipboard. */
  const copyResultUrl = async () => {
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
        itemName: result.data.itemName,
        priceUSDC: result.data.priceUSDC,
        description: result.data.description,
        shippingWindow: result.data.shippingWindow,
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
            maxLength={ESCROW_LIMITS.itemNameMaxLength}
            placeholder="Awesome Widget"
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none ring-0 transition focus:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus-visible:ring-zinc-300"
            aria-invalid={Boolean(errors.itemName)}
            aria-describedby={errors.itemName ? "itemName-error" : undefined}
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

        <div>
          <label
            htmlFor="description"
            className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Description
          </label>
          <input
            id="description"
            name="description"
            type="text"
            value={values.description}
            onChange={(event) => updateField("description", event.target.value)}
            disabled={isSubmitting}
            maxLength={ESCROW_LIMITS.descriptionMaxLength}
            placeholder="Brief description"
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none ring-0 transition focus:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus-visible:ring-zinc-300"
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? "description-error" : undefined}
          />
          {errors.description ? (
            <p id="description-error" role="alert" className="mt-2 text-sm text-red-600">
              {errors.description}
            </p>
          ) : null}
        </div>
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
            aria-invalid={Boolean(errors.shippingWindow)}
            aria-describedby={errors.shippingWindow ? "shippingWindow-error" : undefined}
          >
            {shippingOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {errors.shippingWindow ? (
            <p id="shippingWindow-error" role="alert" className="mt-2 text-sm text-red-600">
              {errors.shippingWindow}
            </p>
          ) : null}
        </div>
        </FormField>
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
        />
      )}
    </div>
  );
}
