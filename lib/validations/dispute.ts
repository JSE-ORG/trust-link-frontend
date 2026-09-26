import { z } from "zod";

export const DisputeFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .regex(/\S+@\S+\.\S+/, "Email is invalid"),
  orderNumber: z.string().min(1, "Order number is required"),
  reason: z.string().min(1, "Reason is required"),
  description: z
    .string()
    .min(1, "Description is required")
    .min(20, "Description must be at least 20 characters"),
  files: z.array(z.instanceof(File)).min(1, "Please upload at least one file as evidence"),
  agreeToTerms: z
    .boolean()
    .refine((val) => val === true, "You must agree to the terms"),
}).strict();

export type DisputeFormValues = z.infer<typeof DisputeFormSchema>;
