import React from "react";

import { FormField } from "@/components/ui/FormField";
import type { DisputeFormValues } from "@/lib/validations/dispute";

interface Props {
  formData: DisputeFormValues;
  errors: Partial<Record<keyof DisputeFormValues, string>>;
  updateField: <K extends keyof DisputeFormValues>(field: K, value: DisputeFormValues[K]) => void;
}

const inputClass =
  "w-full rounded border border-zinc-300 bg-white p-2.5 text-base text-foreground outline-none transition focus:border-success dark:border-zinc-700 dark:bg-zinc-900";

export function DisputeStepDetails({ formData, errors, updateField }: Props) {
  return (
    <div data-testid="step-2">
      <h2 className="mb-4 text-xl font-semibold text-foreground">Step 2: Dispute Details</h2>
      <FormField id="reason" label="Reason for Dispute *" error={errors.reason}>
        <select
          id="reason"
          value={formData.reason}
          onChange={(e) => updateField("reason", e.target.value)}
          aria-label="reason"
          className={inputClass}
        >
          <option value="">Select a reason</option>
          <option value="product_not_received">Product not received</option>
          <option value="damaged_product">Damaged product</option>
          <option value="wrong_product">Wrong product received</option>
          <option value="defective_product">Defective product</option>
          <option value="billing_error">Billing error</option>
        </select>
      </FormField>

      <FormField
        id="description"
        label="Description *"
        error={errors.description}
        hint={`${formData.description.length}/20 characters minimum`}
      >
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => updateField("description", e.target.value)}
          rows={5}
          placeholder="Please provide detailed information about your dispute (minimum 20 characters)"
          aria-label="description"
          className={inputClass}
        />
      </FormField>
    </div>
  );
}
