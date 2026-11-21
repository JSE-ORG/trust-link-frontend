"use client";

import { CheckCircle2, Loader2, Send } from "lucide-react";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/FormField";
import { Input } from "@/components/ui/input";

export const CONTACT_CATEGORIES = [
  "Support",
  "Dispute Inquiries",
  "Vendor Partnership",
  "Bug Report",
] as const;

export type ContactCategory = (typeof CONTACT_CATEGORIES)[number];

export interface ContactFormData {
  fullName: string;
  email: string;
  category: ContactCategory | "";
  subject: string;
  message: string;
}

export interface ContactFormErrors {
  fullName?: string;
  email?: string;
  category?: string;
  subject?: string;
  message?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_MESSAGE_LENGTH = 20;

export default function ContactForm() {
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: "",
    email: "",
    category: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const validate = (): boolean => {
    const nextErrors: ContactFormErrors = {};

    if (!formData.fullName.trim()) {
      nextErrors.fullName = "Full name is required.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email address is required.";
    } else if (!EMAIL_REGEX.test(formData.email.trim())) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (!formData.category) {
      nextErrors.category = "Please select an inquiry category.";
    } else if (!CONTACT_CATEGORIES.includes(formData.category as ContactCategory)) {
      nextErrors.category = "Invalid category selected.";
    }

    if (!formData.subject.trim()) {
      nextErrors.subject = "Subject is required.";
    }

    if (!formData.message.trim()) {
      nextErrors.message = "Message is required.";
    } else if (formData.message.trim().length < MIN_MESSAGE_LENGTH) {
      nextErrors.message = `Message must be at least ${MIN_MESSAGE_LENGTH} characters.`;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (
    field: keyof ContactFormData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field-specific error as user types
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please correct the errors in the form before submitting.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulate submission delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      toast.success("Thank you! Your message has been sent successfully.");
      setIsSubmitted(true);
      setFormData({
        fullName: "",
        email: "",
        category: "",
        subject: "",
        message: "",
      });
      setErrors({});
    } catch {
      toast.error("Failed to send message. Please try again or email us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setIsSubmitted(false);
    setFormData({
      fullName: "",
      email: "",
      category: "",
      subject: "",
      message: "",
    });
    setErrors({});
  };

  if (isSubmitted) {
    return (
      <div
        data-testid="contact-success-screen"
        className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="mt-4 text-2xl font-bold text-zinc-950 dark:text-white">
          Message Sent Successfully
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-600 dark:text-zinc-400">
          Thank you for reaching out to TrustLink. Our support team has received your inquiry
          and will respond to your email as soon as possible.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="w-full sm:w-auto"
          >
            Send Another Message
          </Button>
          <Link
            href="/"
            className="inline-flex h-10 w-full items-center justify-center rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 sm:w-auto"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sm:p-8"
      aria-label="Contact form"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          id="fullName"
          label="Full Name"
          error={errors.fullName}
        >
          <Input
            id="fullName"
            name="fullName"
            type="text"
            placeholder="Jane Doe"
            autoComplete="name"
            value={formData.fullName}
            onChange={(e) => handleChange("fullName", e.target.value)}
            disabled={isSubmitting}
            required
          />
        </FormField>

        <FormField
          id="email"
          label="Email Address"
          error={errors.email}
        >
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="jane@example.com"
            autoComplete="email"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            disabled={isSubmitting}
            required
          />
        </FormField>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <FormField
          id="category"
          label="Inquiry Category"
          error={errors.category}
        >
          <select
            id="category"
            name="category"
            value={formData.category}
            onChange={(e) => handleChange("category", e.target.value)}
            disabled={isSubmitting}
            required
            className="flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-zinc-300"
          >
            <option value="" disabled>
              Select an inquiry category
            </option>
            {CONTACT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          id="subject"
          label="Subject"
          error={errors.subject}
        >
          <Input
            id="subject"
            name="subject"
            type="text"
            placeholder="Brief summary of your inquiry"
            value={formData.subject}
            onChange={(e) => handleChange("subject", e.target.value)}
            disabled={isSubmitting}
            required
          />
        </FormField>
      </div>

      <FormField
        id="message"
        label="Message"
        error={errors.message}
        hint={`Minimum ${MIN_MESSAGE_LENGTH} characters. (${formData.message.trim().length}/${MIN_MESSAGE_LENGTH})`}
      >
        <textarea
          id="message"
          name="message"
          rows={5}
          placeholder="Please describe your inquiry, escrow ID, or feedback with as much detail as possible..."
          value={formData.message}
          onChange={(e) => handleChange("message", e.target.value)}
          disabled={isSubmitting}
          required
          className="flex min-h-[120px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-300"
        />
      </FormField>

      <div className="flex items-center justify-end pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Send Message
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
