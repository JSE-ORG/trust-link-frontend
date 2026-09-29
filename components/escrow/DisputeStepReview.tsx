import React from "react";

import type { DisputeFormValues } from "@/lib/validations/dispute";

/**
 * Props for {@link DisputeStepReview}.
 *
 * All state is owned by the parent dispute form (see `useDisputeFormState`);
 * this step is a controlled, presentational view over it.
 */
export interface DisputeStepReviewProps {
  /**
   * Current dispute form values. Every field is read here, as this step is the
   * wizard's summary of steps 1-3.
   */
  formData: DisputeFormValues;
  /**
   * Validation messages keyed by form field. Only `errors.agreeToTerms` is
   * rendered — the earlier steps own the messages for their own fields, so an
   * error for e.g. `name` is intentionally ignored here.
   */
  errors: Partial<Record<keyof DisputeFormValues, string>>;
  /**
   * Type-safe setter for a single form field. The generic ties `value` to the
   * type of `field`, so `updateField("agreeToTerms", "yes")` is a compile
   * error. This step only ever calls it with `"agreeToTerms"`.
   */
  updateField: <K extends keyof DisputeFormValues>(field: K, value: DisputeFormValues[K]) => void;
}

/**
 * Step 4 of the dispute form: review & submit.
 *
 * Shows a read-only summary of what the user entered in steps 1-3 (personal
 * information, dispute details, uploaded evidence) alongside the one control
 * this screen owns: the accuracy-confirmation checkbox that gates submission.
 * The checkbox is a controlled input — its state comes from
 * `formData.agreeToTerms` and every change is written back through
 * `updateField`, so the parent stays the single source of truth.
 *
 * @param props - Component properties.
 * @returns The review step, ready for submission.
 *
 * @example
 * ```tsx
 * <DisputeStepReview formData={formData} errors={errors} updateField={updateField} />
 * ```
 */
export function DisputeStepReview({
  formData,
  errors,
  updateField,
}: DisputeStepReviewProps) {
  return (
    <div data-testid="step-4">
      <h2 className="mb-4 text-xl font-semibold text-foreground">Step 4: Review & Submit</h2>
      <div className="mb-5 rounded-lg bg-zinc-50 p-5 dark:bg-zinc-800" data-testid="review-section">
        <h3 className="mt-0 text-base font-semibold text-foreground">Personal Information</h3>
        <p className="text-sm text-foreground">
          <strong>Name:</strong> {formData.name}
        </p>
        <p className="text-sm text-foreground">
          <strong>Email:</strong> {formData.email}
        </p>
        <p className="text-sm text-foreground">
          <strong>Order Number:</strong> {formData.orderNumber}
        </p>

        <h3 className="mt-0 text-base font-semibold text-foreground">Dispute Details</h3>
        <p className="text-sm text-foreground">
          <strong>Reason:</strong> {formData.reason}
        </p>
        <p className="text-sm text-foreground">
          <strong>Description:</strong> {formData.description}
        </p>

        <h3 className="mt-0 text-base font-semibold text-foreground">Evidence</h3>
        <p className="text-sm text-foreground">
          <strong>Files:</strong> {formData.files.length} file(s) uploaded
        </p>
        <ul className="space-y-1 p-0 text-sm text-foreground">
          {/* `File` has no stable identifier of its own, and the list only
              changes between steps, so the upload order is used as the key. */}
          {formData.files.map((file, index) => (
            <li key={index} className="ml-4">
              {file.name}
            </li>
          ))}
        </ul>

        <div className="mb-5 mt-4">
          <label className="block">
            {/* Nesting already associates the label, but the visible text is a
                long confirmation sentence; `aria-label` replaces it with a
                short, stable accessible name. `aria-describedby` is set only
                while an error exists, so it stays absent rather than empty in
                the clean state. */}
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
          {/* The `&&` guard narrows `errors.agreeToTerms` to `string`, so the
              message renders without an assertion. */}
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
