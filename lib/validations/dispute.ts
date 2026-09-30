import { z } from "zod";

// Shared email validation - properly validates email format
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// File validation constants
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_FILE_COUNT = 5;
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
];

export const DisputeFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be 100 characters or less"),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .regex(EMAIL_REGEX, "Email is invalid"),
  orderNumber: z.string().trim().min(1, "Order number is required").max(50, "Order number must be 50 characters or less"),
  reason: z.string().min(1, "Reason is required"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .min(20, "Description must be at least 20 characters")
    .max(2000, "Description must be 2000 characters or less"),
  files: z
    .array(z.instanceof(File))
    .min(1, "Please upload at least one file as evidence")
    .max(MAX_FILE_COUNT, `Maximum ${MAX_FILE_COUNT} files allowed`)
    .refine(
      (files) => files.every((file) => file.size <= MAX_FILE_SIZE),
      `Each file must be ${MAX_FILE_SIZE / 1024 / 1024}MB or less`
    )
    .refine(
      (files) => files.every((file) => ALLOWED_FILE_TYPES.includes(file.type)),
      `Only images, PDFs, and text files are allowed`
    ),
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, "You must agree to the terms"),
}).strict();

export type DisputeFormValues = z.infer<typeof DisputeFormSchema>;

export { ALLOWED_FILE_TYPES, EMAIL_REGEX, MAX_FILE_COUNT, MAX_FILE_SIZE };
