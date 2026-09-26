import type { DisputeFormValues } from "./dispute";

type ErrorRecord = Partial<Record<keyof DisputeFormValues, string>>;

export function validateStep1Data(formData: DisputeFormValues): ErrorRecord {
  const newErrors: ErrorRecord = {};

  if (!formData.name.trim()) {
    newErrors.name = "Name is required";
  }
  if (!formData.email.trim()) {
    newErrors.email = "Email is required";
  } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
    newErrors.email = "Email is invalid";
  }
  if (!formData.orderNumber.trim()) {
    newErrors.orderNumber = "Order number is required";
  }

  return newErrors;
}

export function validateStep2Data(formData: DisputeFormValues): ErrorRecord {
  const newErrors: ErrorRecord = {};

  if (!formData.reason) {
    newErrors.reason = "Reason is required";
  }
  if (!formData.description.trim()) {
    newErrors.description = "Description is required";
  } else if (formData.description.length < 20) {
    newErrors.description = "Description must be at least 20 characters";
  }

  return newErrors;
}

export function validateStep3Data(formData: DisputeFormValues): ErrorRecord {
  const newErrors: ErrorRecord = {};

  if (formData.files.length === 0) {
    newErrors.files = "Please upload at least one file as evidence";
  }

  return newErrors;
}

export function validateStep4Data(formData: DisputeFormValues): ErrorRecord {
  const newErrors: ErrorRecord = {};

  if (!formData.agreeToTerms) {
    newErrors.agreeToTerms = "You must agree to the terms";
  }

  return newErrors;
}
