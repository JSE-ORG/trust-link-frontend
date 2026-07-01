"use client";

import { ChangeEvent, DragEvent, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, Upload, X } from "lucide-react";
import { createDispute } from "@/lib/api";
import { track } from "@/lib/analytics";
import { toast } from "sonner";

const MAX_FILES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/** Allowed MIME types for evidence uploads. */
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

const ALLOWED_TYPES_LABEL = "JPG, PNG, WebP or PDF";
const ACCEPT_ATTR = ALLOWED_TYPES.join(",");

interface DisputeFormProps {
  escrowId: string;
}

export default function DisputeForm({ escrowId }: DisputeFormProps) {
  const [reason, setReason] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelection = (selectedFiles: FileList | null) => {
    const nextFiles = Array.from(selectedFiles ?? []);
    const rejectedByType = nextFiles.filter((f) => !ALLOWED_TYPES.includes(f.type as typeof ALLOWED_TYPES[number]));
    const rejectedBySize = nextFiles.filter((f) => f.size > MAX_FILE_SIZE);
    const validFiles = nextFiles.filter(
      (f) => ALLOWED_TYPES.includes(f.type as typeof ALLOWED_TYPES[number]) && f.size <= MAX_FILE_SIZE
    );

    if (rejectedByType.length > 0) {
      setError(`Please upload an image (JPG, PNG, WebP) or PDF. The following file(s) have an unsupported type: ${rejectedByType.map((f) => f.name).join(", ")}`);
      return;
    }
    if (rejectedBySize.length > 0) {
      setError(`Each file must be 10 MB or smaller. The following file(s) are too large: ${rejectedBySize.map((f) => f.name).join(", ")}`);
      return;
    }

    setError(null);
    if (files.length + validFiles.length > MAX_FILES) {
      setError(`You can upload a maximum of ${MAX_FILES} files.`);
      return;
    }

    setFiles((current) => {
      const merged = [...current, ...validFiles];
      return merged;
    });
  };

  const removeFile = (index: number) => {
    setFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (reason.trim().length < 20) {
      setError("Please describe the issue in at least 20 characters.");
      return;
    }

    if (files.length === 0) {
      setError("Please attach at least one image or PDF as evidence.");
      return;
    }

    if (files.length > MAX_FILES) {
      setError(`You can upload up to ${MAX_FILES} files.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await createDispute(escrowId, {
        reason: reason.trim(),
        description: reason.trim(),
        evidence: files.map((file) => file.name),
      });

      track("dispute_raised", { escrowId });
      setSubmittedId(result.id ?? "DISPUTE-1");
      toast.success("Dispute submitted successfully");
    } catch (err: any) {
      setError(err?.message || "Failed to submit dispute.");
      toast.error(err?.message || "Failed to submit dispute.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submittedId) {
    return (
      <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-950 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/20 dark:text-emerald-100">
        <h2 className="text-2xl font-semibold">Dispute submitted</h2>
        <p className="mt-2 text-sm text-emerald-800 dark:text-emerald-200">A case has been created for your order.</p>
        <p className="mt-4 rounded-2xl bg-white/80 px-4 py-3 text-sm dark:bg-black/20">Reference ID: {submittedId}</p>
      </section>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950 sm:p-8">
      <div className="space-y-2">
        <label htmlFor="reason" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Reason for dispute</label>
        <textarea
          id="reason"
          rows={6}
          minLength={20}
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          placeholder="Explain what went wrong with your order, including any delivery or item issues."
          className="w-full rounded-2xl border border-zinc-200 bg-transparent px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/20 dark:border-zinc-800 dark:text-zinc-100"
        />
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Minimum 20 characters. This is the reason the support team will review.</p>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Evidence files</label>
        <div
          onDragOver={(event: DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(event: DragEvent<HTMLDivElement>) => {
            event.preventDefault();
            setIsDragging(false);
            handleFileSelection(event.dataTransfer.files);
          }}
          className={`rounded-3xl border border-dashed p-6 text-center transition-colors ${isDragging ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-zinc-200 dark:border-zinc-800"}`}
        >
          <input
            id="evidence"
            type="file"
            accept={ACCEPT_ATTR}
            multiple
            className="hidden"
            onChange={(event: ChangeEvent<HTMLInputElement>) => handleFileSelection(event.target.files)}
          />
          <label htmlFor="evidence" className="flex cursor-pointer flex-col items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
            <Upload className="h-5 w-5 text-[var(--accent)]" />
            <span className="font-medium text-zinc-900 dark:text-zinc-100">Upload images or PDFs</span>
            <span>Up to {MAX_FILES} files, 10 MB each</span>
          </label>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Accepted formats: {ALLOWED_TYPES_LABEL}. Max {MAX_FILES} files, 10 MB each.</p>

        {files.length > 0 && (
          <ul className="space-y-2">
            {files.map((file, index) => (
              <li key={`${file.name}-${index}`} className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900/70">
                <span className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200"><FileText className="h-4 w-4" />{file.name}</span>
                <button type="button" onClick={() => removeFile(index)} className="rounded-full p-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label={`Remove ${file.name}`}>
                  <X className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && (
        <p className="flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/20 dark:text-rose-200">
          <AlertCircle className="h-4 w-4" />{error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-[var(--destructive)] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "Submitting dispute..." : "Submit dispute"}
      </button>

      <p className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
        Your dispute will be sent to the backend dispute API and reviewed by support.
      </p>
    </form>
  );
}
