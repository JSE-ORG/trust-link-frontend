"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { Escrow, Dispute } from "@/types";
import { createDispute } from "@/lib/api";

interface DisputeFormProps {
  escrow: Escrow;
}

const MAX_FILES = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/gif", "image/webp"];

export default function DisputeForm({ escrow }: DisputeFormProps) {
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<Dispute | null>(null);

  const validateFiles = (selectedFiles: File[]) => {
    const allFiles = [...files, ...selectedFiles];
    if (allFiles.length > MAX_FILES) {
      setError(`You can upload up to ${MAX_FILES} files.`);
      return false;
    }

    for (const file of selectedFiles) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("Only image files and PDFs are accepted.");
        return false;
      }
      if (file.size > MAX_FILE_BYTES) {
        setError("Each file must be 10MB or smaller.");
        return false;
      }
    }

    setError(null);
    return true;
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) return;
    if (!validateFiles(selectedFiles)) return;
    setFiles((current) => [...current, ...selectedFiles]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (reason.trim().length < 20) {
      setError("Reason must be at least 20 characters.");
      return;
    }
    if (files.length > MAX_FILES) {
      setError(`You can upload up to ${MAX_FILES} files.`);
      return;
    }

    const formData = new FormData();
    formData.append("escrowId", escrow.id);
    formData.append("reason", reason.trim());
    files.forEach((file) => formData.append("evidence", file));

    setIsSubmitting(true);
    setError(null);

    try {
      const dispute = await createDispute(formData);
      setSuccess(dispute);
      setReason("");
      setFiles([]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to submit dispute. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-3xl border border-green-200 bg-green-50 p-6 shadow-sm dark:border-green-900 dark:bg-green-950">
        <h2 className="text-2xl font-semibold text-green-900 dark:text-green-100">Dispute Submitted</h2>
        <p className="mt-3 text-zinc-700 dark:text-zinc-300">
          Your dispute has been submitted successfully. Reference ID:
        </p>
        <p className="mt-2 rounded-2xl bg-white px-4 py-3 font-mono text-sm text-zinc-800 shadow-sm dark:bg-zinc-900 dark:text-zinc-100">
          {success.id}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <h1 className="text-3xl font-bold text-zinc-950 dark:text-zinc-100">Submit a Dispute</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Tell us why you’re raising a dispute and attach any supporting evidence.
        </p>
      </div>

      <div>
        <label htmlFor="reason" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Reason for dispute
        </label>
        <textarea
          id="reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          rows={6}
          className="mt-2 w-full rounded-3xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-blue-400 dark:focus:ring-blue-900"
          placeholder="Explain the issue in detail (minimum 20 characters)..."
        />
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Minimum 20 characters.</p>
      </div>

      <div>
        <label htmlFor="evidence" className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Evidence files
        </label>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Upload up to {MAX_FILES} files. Images and PDFs only, maximum 10MB each.
        </p>
        <input
          id="evidence"
          type="file"
          multiple
          accept="image/*,application/pdf"
          onChange={handleFileChange}
          className="mt-3 w-full text-sm text-zinc-700 file:mr-4 file:rounded-full file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white dark:text-zinc-100"
        />
      </div>

      {files.length > 0 && (
        <div className="space-y-2 rounded-3xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Selected files</p>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={`${file.name}-${file.size}-${index}`} className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100">
                <span>{file.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-3xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-600"
      >
        {isSubmitting ? "Submitting dispute..." : "Submit Dispute"}
      </button>
    </form>
  );
}
