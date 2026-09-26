import React from "react";

import { FormField } from "@/components/ui/FormField";
import type { DisputeFormValues } from "@/lib/validations/dispute";

/**
 * Props for {@link DisputeStepDetails}.
 *
 * All state is owned by the parent dispute form (see `useDisputeFormState`);
 * this step is a controlled, presentational view over it.
 */
export interface DisputeStepDetailsProps {
  /** Current dispute form values. Only `reason` and `description` are read by this step. */
  formData: DisputeFormValues;
  /**
   * Validation messages keyed by form field. `errors.reason` and
   * `errors.description` are shown under their inputs; an error replaces
   * that field's hint text.
   */
  errors: Partial<Record<keyof DisputeFormValues, string>>;
  /**
   * Type-safe setter for a single form field. The generic ties `value` to the
   * type of `field`, so `updateField("reason", 42)` is a compile error.
   */
  updateField: <K extends keyof DisputeFormValues>(field: K, value: DisputeFormValues[K]) => void;
}

/** A selectable dispute reason: the stored `value` and its user-facing `label`. */
interface DisputeReasonOption {
  /** Value written to `formData.reason`. */
  value: string;
  /** Text shown in the dropdown. */
  label: string;
}

/** Options for the "Reason for Dispute" dropdown, in display order. */
const DISPUTE_REASON_OPTIONS: readonly DisputeReasonOption[] = [
  { value: "product_not_received", label: "Product not received" },
  { value: "damaged_product", label: "Damaged product" },
  { value: "wrong_product", label: "Wrong product received" },
  { value: "defective_product", label: "Defective product" },
  { value: "billing_error", label: "Billing error" },
];

/**
 * Minimum description length. Mirrors the `.min(20)` rule on `description`
 * in `DisputeFormSchema`; used for the live character-count hint.
 */
const MIN_DESCRIPTION_LENGTH = 20;

const inputClass =
  "w-full rounded border border-zinc-300 bg-white p-2.5 text-base text-foreground outline-none transition focus:border-success dark:border-zinc-700 dark:bg-zinc-900";

/**
 * Step 2 of the dispute form: dispute details.
 *
 * Renders a reason dropdown and a free-text description with a live
 * `n/20 characters minimum` counter. Both inputs are controlled through
 * `formData` / `updateField`, and their validation errors come from `errors`.
 *
 * @example
 * ```tsx
 * <DisputeStepDetails formData={formData} errors={errors} updateField={updateField} />
 * ```
 */
export function DisputeStepDetails({ formData, errors, updateField }: DisputeStepDetailsProps) {
  return (
    <div className="step step-2" data-testid="step-2">
      <h2>Step 2: Dispute Details</h2>
      <div className="form-group">
        <FormField
          id="reason"
          label="Reason for Dispute *"
          error={errors.reason}
        >
          <select
            id="reason"
            value={formData.reason}
            onChange={(e) => updateField("reason", e.target.value)}
            aria-label="reason"
            className={inputClass}
          >
            <option value="">Select a reason</option>
            {DISPUTE_REASON_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </FormField>
      </div>

      <div className="form-group">
        <FormField
          id="description"
          label="Description *"
          error={errors.description}
          hint={`${formData.description.length}/${MIN_DESCRIPTION_LENGTH} characters minimum`}
        >
          <textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            rows={5}
            placeholder={`Please provide detailed information about your dispute (minimum ${MIN_DESCRIPTION_LENGTH} characters)`}
            aria-label="description"
            className={inputClass}
          />
        </FormField>
      </div>
    </div>
  );
}
