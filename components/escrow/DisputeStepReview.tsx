import React from "react";

import type { DisputeFormValues } from "@/lib/validations/dispute";

interface Props {
  formData: DisputeFormValues;
  errors: Partial<Record<keyof DisputeFormValues, string>>;
  updateField: <K extends keyof DisputeFormValues>(field: K, value: DisputeFormValues[K]) => void;
}

export function DisputeStepReview({ formData, errors, updateField }: Props) {
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
              {errors.agreeToTerms as string}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
