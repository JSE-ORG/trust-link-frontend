"use client";

import React, { useEffect } from "react";

import type { DisputeFormValues } from "@/lib/validations/dispute";
import type { SubmitDisputeFormResponse } from "@/types/api";

import { DisputeFormError } from "./DisputeFormError";
import { DisputeFormNavigation } from "./DisputeFormNavigation";
import { DisputeFormProgress } from "./DisputeFormProgress";
import { DisputeFormSuccess } from "./DisputeFormSuccess";
import { DisputeStepDetails } from "./DisputeStepDetails";
import { DisputeStepEvidence } from "./DisputeStepEvidence";
import { DisputeStepInfo } from "./DisputeStepInfo";
import { DisputeStepReview } from "./DisputeStepReview";
import { useDisputeFormState } from "./useDisputeFormState";

/**
 * Props for the DisputeForm component.
 *
 * All props are optional — the component is usable with no configuration, in
 * which case it POSTs the collected values to `apiEndpoint` itself. The callbacks
 * exist to let a caller replace or observe that network call without reimplementing
 * the wizard.
 */
export interface DisputeFormProps {
  /**
   * Replaces the built-in submission request entirely. When provided, the form
   * calls this with the raw wizard values and never touches `apiEndpoint`; a
   * rejected promise puts the form into its error state.
   */
  onSubmit?: (data: DisputeFormValues) => Promise<void>;
  /**
   * Route the wizard posts to when `onSubmit` is not supplied.
   *
   * @default "/api/dispute"
   */
  apiEndpoint?: string;
  /**
   * Called with the parsed response body after a successful request made through
   * `apiEndpoint`. Not invoked when `onSubmit` is supplied, since that path never
   * produces a `SubmitDisputeFormResponse`.
   */
  onSuccess?: (response: SubmitDisputeFormResponse) => void;
  /**
   * Called when a submission fails, for logging or telemetry alongside the
   * built-in error screen. Only receives genuine `Error` values; non-Error
   * rejections still render the error state but are skipped here.
   */
  onError?: (error: Error) => void;
}

/**
 * DisputeForm
 *
 * The dispute submission wizard. Owns no field state itself — everything is
 * provided by {@link useDisputeFormState}, so this component's job is purely
 * composition:
 *
 * 1. While the wizard is in progress it renders {@link DisputeFormProgress} plus
 *    exactly one of the four step components, selected by `currentStep`. Each
 *    step receives the shared `formData`/`errors` and whatever edit callback it
 *    needs, and {@link DisputeFormNavigation} drives the transitions.
 * 2. Once submission settles, the form is replaced wholesale by either
 *    {@link DisputeFormSuccess} or {@link DisputeFormError}. The step markup is
 *    unmounted rather than hidden, so a finished dispute cannot be edited back
 *    into existence.
 *
 * The `<form>` never performs a native submit (`noValidate`, and `onSubmit` only
 * calls `preventDefault`): step validation and the final send are triggered from
 * the navigation buttons so invalid HTML validation cannot preempt the app's own
 * per-step checks.
 *
 * @param props - Component properties.
 * @returns The active wizard step, or the success/error screen.
 */
const DisputeForm: React.FC<DisputeFormProps> = ({
  onSubmit,
  apiEndpoint = "/api/dispute",
  onSuccess,
  onError,
}) => {
  const {
    currentStep,
    formData,
    errors,
    isSubmitting,
    submitStatus,
    submitMessage,
    firstErrorRef,
    handleNext,
    handleBack,
    updateField,
    handleFileUpload,
    removeFile,
    handleSubmit,
    resetForm,
  } = useDisputeFormState({ onSubmit, apiEndpoint, onSuccess, onError });

  // Move focus to the first invalid control whenever a validation pass reports
  // errors. The steps render their messages inline, so without this a keyboard
  // or screen-reader user would get no feedback that "Next" was refused.
  // `firstErrorRef` is populated by the hook during validation.
  useEffect(() => {
    const errorKeys = Object.keys(errors).filter(
      (key) => errors[key as keyof DisputeFormValues]
    );
    if (errorKeys.length > 0 && firstErrorRef.current) {
      firstErrorRef.current.focus();
    }
  }, [errors, firstErrorRef]);

  if (submitStatus === "success") {
    return (
      <DisputeFormSuccess message={submitMessage} onReset={resetForm} />
    );
  }

  if (submitStatus === "error") {
    return (
      <DisputeFormError
        message={submitMessage}
        // Retrying means starting over, not re-sending the same payload: reset
        // returns the wizard to step 1 and clears the error status.
        onRetry={() => {
          resetForm();
        }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-[600px] p-5" data-testid="dispute-form">
      <DisputeFormProgress currentStep={currentStep} />

      <form
        onSubmit={(e) => e.preventDefault()}
        aria-label="Dispute submission form"
        noValidate
      >
        {currentStep === 1 && (
          <DisputeStepInfo
            formData={formData}
            errors={errors}
            updateField={updateField}
          />
        )}
        {currentStep === 2 && (
          <DisputeStepDetails
            formData={formData}
            errors={errors}
            updateField={updateField}
          />
        )}
        {currentStep === 3 && (
          <DisputeStepEvidence
            formData={formData}
            errors={errors}
            handleFileUpload={handleFileUpload}
            removeFile={removeFile}
          />
        )}
        {currentStep === 4 && (
          <DisputeStepReview
            formData={formData}
            errors={errors}
            updateField={updateField}
          />
        )}

        <DisputeFormNavigation
          currentStep={currentStep}
          isSubmitting={isSubmitting}
          onBack={handleBack}
          onNext={handleNext}
          onSubmit={handleSubmit}
        />
      </form>
    </div>
  );
};

export default DisputeForm;
