"use client";

import { useTranslation } from "react-i18next";

import { FormField } from "@/components/ui/FormField";
import { renderMarkdown } from "@/lib/markdown";
import {
  type EscrowCreateValues,
  priceSchema,
  shippingOptions,
  type ShippingWindow,
} from "@/lib/validations";
import { formatUSDC } from "@/utils/currency";

const inputClassName =
  "w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none ring-0 transition focus:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus-visible:ring-zinc-300";
const PLATFORM_FEE_RATE = 0.015;

interface EscrowCreateFormFieldsProps {
  values: EscrowCreateValues;
  errors: Partial<Record<keyof EscrowCreateValues, string>>;
  disabled: boolean;
  onChange: <K extends keyof EscrowCreateValues>(
    field: K,
    value: EscrowCreateValues[K]
  ) => void;
}

/** The four input fields (item, price, description, shipping window) of the escrow create form. */
export function EscrowCreateFormFields({
  values,
  errors,
  disabled,
  onChange,
}: EscrowCreateFormFieldsProps) {
  const { t } = useTranslation();
  const parsedPrice = priceSchema.safeParse(values.priceUSDC);
  const price = parsedPrice.success ? Number(parsedPrice.data) : null;
  const feeAmount = price === null ? null : price * PLATFORM_FEE_RATE;

  return (
    <>
      <FormField label="Item name" id="itemName" error={errors.itemName}>
        <input
          id="itemName"
          name="itemName"
          type="text"
          value={values.itemName}
          onChange={(event) => onChange("itemName", event.target.value)}
          disabled={disabled}
          placeholder="Awesome Widget"
          className={inputClassName}
        />
      </FormField>

      <FormField label="Price (USDC)" id="priceUSDC" error={errors.priceUSDC}>
        <input
          id="priceUSDC"
          name="priceUSDC"
          type="number"
          step="0.01"
          value={values.priceUSDC}
          onChange={(event) => onChange("priceUSDC", event.target.value)}
          disabled={disabled}
          placeholder="123.45"
          className={inputClassName}
        />
      </FormField>
      {price !== null && feeAmount !== null && (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/50">
          <dl className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <dt className="text-zinc-600 dark:text-zinc-400">
                {t("escrow.feeBreakdown.itemPrice")}
              </dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                {formatUSDC(price)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="text-zinc-600 dark:text-zinc-400">
                {t("escrow.feeBreakdown.platformFee", {
                  percent: PLATFORM_FEE_RATE * 100,
                })}
              </dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                {formatUSDC(feeAmount)}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4 border-t border-zinc-200 pt-3 dark:border-zinc-700">
              <dt className="font-semibold text-zinc-900 dark:text-zinc-100">
                {t("escrow.feeBreakdown.vendorPayout")}
              </dt>
              <dd className="font-bold text-zinc-900 dark:text-zinc-100">
                {formatUSDC(price - feeAmount)}
              </dd>
            </div>
          </dl>
        </div>
      )}

      <FormField
        label="Description"
        id="description"
        error={errors.description}
      >
        <textarea
          id="description"
          name="description"
          value={values.description}
          onChange={(event) => onChange("description", event.target.value)}
          disabled={disabled}
          placeholder="Brief description (markdown supported: **bold**, *italic*, [link](url))"
          rows={3}
          className={inputClassName}
        />
        {values.description && (
          <div className="mt-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900">
            <p className="mb-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">Preview:</p>
            <div
              className="text-sm text-zinc-700 dark:text-zinc-300"
              dangerouslySetInnerHTML={renderMarkdown(values.description)}
            />
          </div>
        )}
      </FormField>

      <FormField label="Shipping window" id="shippingWindow">
        <select
          id="shippingWindow"
          name="shippingWindow"
          value={values.shippingWindow}
          onChange={(event) =>
            onChange("shippingWindow", event.target.value as ShippingWindow)
          }
          disabled={disabled}
          className={inputClassName}
        >
          {shippingOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </FormField>
    </>
  );
}
