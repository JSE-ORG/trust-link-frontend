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

interface DisputeFormProps {
  onSubmit?: (data: DisputeFormValues) => Promise<void>;
  apiEndpoint?: string;
  onSuccess?: (response: SubmitDisputeFormResponse) => void;
  onError?: (error: Error) => void;
}

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
