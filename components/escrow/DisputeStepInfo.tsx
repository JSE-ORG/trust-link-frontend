import React from "react";

import type { DisputeFormValues } from "@/lib/validations/dispute";

interface Props {
  formData: DisputeFormValues;
  errors: Partial<Record<keyof DisputeFormValues, string>>;
  updateField: <K extends keyof DisputeFormValues>(field: K, value: DisputeFormValues[K]) => void;
}

export function DisputeStepInfo({ formData, errors, updateField }: Props) {
  return (
    <div data-testid="step-1">
      <h2 className="mb-4 text-xl font-semibold text-foreground">Step 1: Personal Information</h2>
      <div className="mb-5">
        <label htmlFor="name" className="mb-1 block font-medium text-foreground">Full Name *</label>
        <input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => updateField("name", e.target.value)}
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
          onChange={(e) => updateField("email", e.target.value)}
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
          onChange={(e) => updateField("orderNumber", e.target.value)}
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
