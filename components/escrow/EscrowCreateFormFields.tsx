"use client";

import { FormField } from "@/components/ui/FormField";
import { renderMarkdown } from "@/lib/markdown";
import {
  type EscrowCreateValues,
  shippingOptions,
  type ShippingWindow,
} from "@/lib/validations";

const inputClassName =
  "w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 outline-none ring-0 transition focus:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus-visible:ring-zinc-300";

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
