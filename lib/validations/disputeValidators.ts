import type { DisputeFormValues } from "./dispute";
import {
  ALLOWED_FILE_TYPES,
  EMAIL_REGEX,
  MAX_FILE_COUNT,
  MAX_FILE_SIZE,
} from "./dispute";

type ErrorRecord = Partial<Record<keyof DisputeFormValues, string>>;

export function validateStep1Data(formData: DisputeFormValues): ErrorRecord {
  const newErrors: ErrorRecord = {};

  const trimmedName = formData.name.trim();
  if (!trimmedName) {
    newErrors.name = "Name is required";
  } else if (trimmedName.length > 100) {
    newErrors.name = "Name must be 100 characters or less";
  }

  const trimmedEmail = formData.email.trim();
  if (!trimmedEmail) {
    newErrors.email = "Email is required";
  } else if (!EMAIL_REGEX.test(trimmedEmail)) {
    newErrors.email = "Email is invalid";
  }

  const trimmedOrderNumber = formData.orderNumber.trim();
  if (!trimmedOrderNumber) {
    newErrors.orderNumber = "Order number is required";
  } else if (trimmedOrderNumber.length > 50) {
    newErrors.orderNumber = "Order number must be 50 characters or less";
  }

  return newErrors;
}

export function validateStep2Data(formData: DisputeFormValues): ErrorRecord {
  const newErrors: ErrorRecord = {};

  if (!formData.reason) {
    newErrors.reason = "Reason is required";
  }

  const trimmedDescription = formData.description.trim();
  if (!trimmedDescription) {
    newErrors.description = "Description is required";
  } else if (trimmedDescription.length < 20) {
    newErrors.description = "Description must be at least 20 characters";
  } else if (trimmedDescription.length > 2000) {
    newErrors.description = "Description must be 2000 characters or less";
  }

  return newErrors;
}

export function validateStep3Data(formData: DisputeFormValues): ErrorRecord {
  const newErrors: ErrorRecord = {};

  if (formData.files.length === 0) {
    newErrors.files = "Please upload at least one file as evidence";
  } else if (formData.files.length > MAX_FILE_COUNT) {
    newErrors.files = `Maximum ${MAX_FILE_COUNT} files allowed`;
  } else if (formData.files.some((file) => file.size > MAX_FILE_SIZE)) {
    newErrors.files = `Each file must be ${MAX_FILE_SIZE / 1024 / 1024}MB or less`;
  } else if (formData.files.some((file) => !ALLOWED_FILE_TYPES.includes(file.type))) {
    newErrors.files = "Only images, PDFs, and text files are allowed";
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
