import React from "react";

import type { DisputeFormValues } from "@/lib/validations/dispute";

/**
 * Props for {@link DisputeStepInfo}.
 *
 * State is managed by the parent dispute form component; this component acts
 * as a controlled, presentational view for collecting buyer personal information.
 */
export interface DisputeStepInfoProps {
  /** Current dispute form values (`name`, `email`, and `orderNumber` are managed by Step 1). */
  formData: DisputeFormValues;
  /**
   * Validation messages keyed by form field name. `errors.name`, `errors.email`,
   * and `errors.orderNumber` are displayed below their corresponding inputs.
   */
  errors: Partial<Record<keyof DisputeFormValues, string>>;
  /**
   * Type-safe callback to update a single form field value.
   *
   * @template K - The form field key extending `keyof DisputeFormValues`.
   * @param field - The field name being updated.
   * @param value - The updated value matching the type of `field`.
   */
  updateField: <K extends keyof DisputeFormValues>(field: K, value: DisputeFormValues[K]) => void;
}

/**
 * Step 1 of the dispute form: Personal Information.
 *
 * Renders controlled text/email input fields for Full Name, Email Address, and Order Number,
 * including accessibility tags (`aria-invalid`, `aria-describedby`, `role="alert"`)
 * and inline validation error feedback.
 *
 * @param props - Component props matching {@link DisputeStepInfoProps}.
 * @returns The rendered Step 1 personal information form section.
 *
 * @example
 * ```tsx
 * <DisputeStepInfo
 *   formData={formData}
 *   errors={errors}
 *   updateField={updateField}
 * />
 * ```
 */
export function DisputeStepInfo({ formData, errors, updateField }: DisputeStepInfoProps) {
  return (
    <div data-testid="step-1">
      <h2 className="mb-4 text-xl font-semibold text-foreground">Step 1: Personal Information</h2>
      <div className="mb-5">
        <label htmlFor="name" className="mb-1 block font-medium text-foreground">Full Name *</label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("name", e.target.value)}
          aria-label="name"
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          className="w-full rounded border border-zinc-300 bg-white p-2.5 text-base text-foreground outline-none transition focus:border-success dark:border-zinc-700 dark:bg-zinc-900"
        />
        {errors.name && (
          <span id="name-error" className="mt-1 block text-sm text-destructive" role="alert">
            {errors.name}
          </span>
        )}
      </div>

      <div className="mb-5">
        <label htmlFor="email" className="mb-1 block font-medium text-foreground">Email Address *</label>
        <input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("email", e.target.value)}
          aria-label="email"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          className="w-full rounded border border-zinc-300 bg-white p-2.5 text-base text-foreground outline-none transition focus:border-success dark:border-zinc-700 dark:bg-zinc-900"
        />
        {errors.email && (
          <span id="email-error" className="mt-1 block text-sm text-destructive" role="alert">
            {errors.email}
          </span>
        )}
      </div>

      <div className="mb-5">
        <label htmlFor="orderNumber" className="mb-1 block font-medium text-foreground">Order Number *</label>
        <input
          id="orderNumber"
          type="text"
          value={formData.orderNumber}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField("orderNumber", e.target.value)}
          aria-label="order number"
          aria-invalid={!!errors.orderNumber}
          aria-describedby={errors.orderNumber ? "orderNumber-error" : undefined}
          className="w-full rounded border border-zinc-300 bg-white p-2.5 text-base text-foreground outline-none transition focus:border-success dark:border-zinc-700 dark:bg-zinc-900"
        />
        {errors.orderNumber && (
          <span id="orderNumber-error" className="mt-1 block text-sm text-destructive" role="alert">
            {errors.orderNumber}
          </span>
        )}
      </div>
    </div>
  );
}

