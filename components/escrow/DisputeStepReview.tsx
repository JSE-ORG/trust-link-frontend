import React from "react";

import type { DisputeFormValues } from "@/lib/validations/dispute";

/**
 * Props for {@link DisputeStepReview}.
 *
 * The component is fully controlled: it owns no state and never validates,
 * it only renders what the parent (`DisputeForm` → `useDisputeFormState`)
 * hands down, so the data shown here is always the exact data that will be
 * submitted from this step.
 */
export interface DisputeStepReviewProps {
  /** Current values of the dispute form, as validated by `DisputeFormSchema`. */
  formData: DisputeFormValues;
  /**
   * Validation messages keyed by field. A key is present only while that
   * field is invalid, so `errors.agreeToTerms` is the sole error this step
   * renders — the earlier steps own the rest, and they stay visible because
   * the parent re-runs validation on every field change.
   */
  errors: Partial<Record<keyof DisputeFormValues, string>>;
  /**
   * Writes a single field back into the parent's form state. Generic over the
   * field name so `value` is checked against that field's own type
   * (e.g. `updateField("agreeToTerms", true)`).
   */
  updateField: <K extends keyof DisputeFormValues>(
    field: K,
    value: DisputeFormValues[K],
  ) => void;
}

/**
 * Reads the field/value row used throughout the review summary.
 *
 * Extracted because the same `<p><strong>Label:</strong> value</p>` pair is
 * repeated for every reviewed field; keeping it in one place is what makes the
 * consistent typography (same class names on every row) verifiable instead of
 * copy-pasted. It renders exactly the same markup the inline version did.
 */
function ReviewField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <p className="text-sm text-foreground">
      <strong>{label}:</strong> {value}
    </p>
  );
}

/**
 * Final step (4 of 4) of the dispute wizard: a read-only summary of everything
 * captured so far, plus the terms checkbox that must be ticked before the
 * parent's submit button is allowed to fire.
 *
 * Behaviour notes:
 * - Evidence files are listed by name only; the count comes from
 *   `formData.files`, which the parent has already filtered to allowed types
 *   and sizes in step 3.
 * - The list is keyed by index because the same file name may legitimately be
 *   uploaded twice and the list is append/remove-only, so positions are stable.
 * - The description is printed in full rather than truncated: this is the last
 *   chance for the user to check it before it is sent.
 */
export function DisputeStepReview({
  formData,
  errors,
  updateField,
}: DisputeStepReviewProps) {
  return (
    <div data-testid="step-4">
      <h2 className="mb-4 text-xl font-semibold text-foreground">Step 4: Review &amp; Submit</h2>
      <div className="mb-5 rounded-lg bg-zinc-50 p-5 dark:bg-zinc-800" data-testid="review-section">
        <h3 className="mt-0 text-base font-semibold text-foreground">Personal Information</h3>
        <ReviewField label="Name" value={formData.name} />
        <ReviewField label="Email" value={formData.email} />
        <ReviewField label="Order Number" value={formData.orderNumber} />

        <h3 className="mt-0 text-base font-semibold text-foreground">Dispute Details</h3>
        <ReviewField label="Reason" value={formData.reason} />
        <ReviewField label="Description" value={formData.description} />

        <h3 className="mt-0 text-base font-semibold text-foreground">Evidence</h3>
        <ReviewField label="Files" value={`${formData.files.length} file(s) uploaded`} />
        <ul className="space-y-1 p-0 text-sm text-foreground">
          {formData.files.map((file, index) => (
            <li key={index} className="ml-4">
              {file.name}
            </li>
          ))}
        </ul>

        <div className="mb-5 mt-4">
          <label className="block">
            <input
              type="checkbox"
              id="agreeToTerms"
              checked={formData.agreeToTerms}
              onChange={(e) => updateField("agreeToTerms", e.target.checked)}
              aria-label="agree to terms"
              aria-invalid={!!errors.agreeToTerms}
              aria-describedby={
                errors.agreeToTerms ? "agreeToTerms-error" : undefined
              }
              className="mr-2"
            />
            I confirm that all information provided is accurate and complete *
          </label>
          {errors.agreeToTerms && (
            <span id="agreeToTerms-error" className="mt-1 block text-sm text-destructive" role="alert">
              {errors.agreeToTerms}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
