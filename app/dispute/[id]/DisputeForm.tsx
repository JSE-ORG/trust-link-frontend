"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChevronLeft, ChevronRight, Upload, X, AlertCircle, CheckCircle2 } from "lucide-react";
import { createDispute } from "@/lib/api";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const REASON_CATEGORIES = [
  "Item Not Received",
  "Item Not as Described",
  "Wrong Item",
  "Damaged",
] as const;

const disputeSchema = z.object({
  reason: z.enum(REASON_CATEGORIES, {
    required_error: "Please select a reason category",
  }),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000),
  evidence: z.array(z.string()).min(1, "At least one piece of evidence is required"),
});

type DisputeValues = z.infer<typeof disputeSchema>;

interface DisputeFormProps {
  escrowId: string;
}

export default function DisputeForm({ escrowId }: DisputeFormProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
    trigger,
  } = useForm<DisputeValues>({
    resolver: zodResolver(disputeSchema),
    defaultValues: {
      evidence: [],
    },
  });

  const formData = watch();

  const nextStep = async () => {
    let fieldsToValidate: (keyof DisputeValues)[] = [];
    if (currentStep === 1) fieldsToValidate = ["reason"];
    if (currentStep === 2) fieldsToValidate = ["description"];
    if (currentStep === 3) fieldsToValidate = ["evidence"];

    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const onSubmit = async (values: DisputeValues) => {
    setIsSubmitting(true);
    try {
      await createDispute(escrowId, values);
      toast.success("Dispute raised successfully");
      router.push(`/track/${escrowId}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to raise dispute");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const newEvidence = [...formData.evidence, "https://example.com/evidence-dummy.jpg"];
    setValue("evidence", newEvidence, { shouldValidate: true });
  };

  const removeEvidence = (index: number) => {
    const newEvidence = formData.evidence.filter((_, i) => i !== index);
    setValue("evidence", newEvidence, { shouldValidate: true });
  };

  const progressPercentage = (currentStep / 4) * 100;

  return (
    <div className="w-full max-w-2xl mx-auto bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
      <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-900">
        <div
          className="h-full bg-[var(--accent)] transition-all duration-300 ease-in-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      <div className="p-6 sm:p-8">
        <header className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
              Step {currentStep} of 4
            </span>
            {currentStep > 1 && (
              <button
                onClick={prevStep}
                className="text-sm font-medium text-[var(--accent)] hover:underline flex items-center gap-1"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            )}
          </div>
          <h1 className="text-2xl font-bold text-zinc-950 dark:text-white">
            {currentStep === 1 && "What's the issue?"}
            {currentStep === 2 && "Describe the issue"}
            {currentStep === 3 && "Upload evidence"}
            {currentStep === 4 && "Review and submit"}
          </h1>
        </header>

        <form onSubmit={handleSubmit(onSubmit)}>
          {currentStep === 1 && (
            <div className="space-y-3">
              {REASON_CATEGORIES.map((reason) => (
                <label
                  key={reason}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                    formData.reason === reason
                      ? "border-[var(--accent)] bg-[var(--accent)]/5"
                      : "border-zinc-100 dark:border-zinc-800 hover:border-zinc-200 dark:hover:border-zinc-700"
                  }`}
                >
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">{reason}</span>
                  <input
                    type="radio"
                    value={reason}
                    {...register("reason")}
                    className="w-5 h-5 accent-[var(--accent)]"
                  />
                </label>
              ))}
              {errors.reason && (
                <p className="text-sm text-[var(--destructive)] flex items-center gap-1 mt-2">
                  <AlertCircle size={14} />
                  {errors.reason.message}
                </p>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-[var(--muted)] mb-2">
                Provide as much detail as possible to help us resolve the dispute quickly.
              </p>
              <textarea
                {...register("description")}
                rows={6}
                className="w-full p-4 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-transparent focus:border-[var(--accent)] outline-none transition-all resize-none text-zinc-900 dark:text-zinc-100"
                placeholder="Tell us what happened..."
              />
              <div className="flex justify-between items-center">
                {errors.description ? (
                  <p className="text-sm text-[var(--destructive)] flex items-center gap-1">
                    <AlertCircle size={14} />
                    {errors.description.message}
                  </p>
                ) : (
                  <span />
                )}
                <span className="text-xs text-[var(--muted)]">
                  {formData.description?.length || 0} / 1000
                </span>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
                  isDragging
                    ? "border-[var(--accent)] bg-[var(--accent)]/5"
                    : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                }`}
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mb-4 text-[var(--muted)]">
                    <Upload size={24} />
                  </div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                    Drag and drop evidence here
                  </p>
                  <p className="text-sm text-[var(--muted)] mb-4">
                    Or click to browse files
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      const newEvidence = [...formData.evidence, "https://example.com/evidence-dummy.jpg"];
                      setValue("evidence", newEvidence, { shouldValidate: true });
                    }}
                    className="px-6 py-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full text-sm font-bold transition-all hover:scale-105 active:scale-95"
                  >
                    Select Files
                  </button>
                </div>
              </div>

              {formData.evidence.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {formData.evidence.map((url, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden group"
                    >
                      <div className="text-[var(--muted)] flex flex-col items-center">
                        <CheckCircle2 size={24} className="text-[var(--success)]" />
                        <span className="text-[10px] mt-1 font-bold">Evidence {index + 1}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeEvidence(index)}
                        className="absolute top-2 right-2 w-8 h-8 bg-white/90 dark:bg-black/90 rounded-full flex items-center justify-center text-[var(--destructive)] shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {errors.evidence && (
                <p className="text-sm text-[var(--destructive)] flex items-center gap-1">
                  <AlertCircle size={14} />
                  {errors.evidence.message}
                </p>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-6 border border-zinc-100 dark:border-zinc-800">
                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
                    Reason
                  </h3>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {formData.reason}
                  </p>
                </div>
                <div className="mb-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
                    Description
                  </h3>
                  <p className="text-zinc-700 dark:text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {formData.description}
                  </p>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)] mb-2">
                    Evidence
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {formData.evidence.map((_, i) => (
                      <div
                        key={i}
                        className="px-3 py-1 bg-white dark:bg-zinc-800 rounded-full border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold text-[var(--muted)] flex items-center gap-1"
                      >
                        <CheckCircle2 size={12} className="text-[var(--success)]" />
                        FILE-{i + 1}.JPG
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                  <strong>Notice:</strong> Raising a dispute will lock the funds in escrow. An
                  arbitrator will review the evidence provided by both parties.
                </p>
              </div>
            </div>
          )}

          <div className="mt-10 flex gap-4">
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex-1 py-4 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-black/10"
              >
                Continue
                <ChevronRight size={18} />
              </button>
            ) : (
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 py-4 bg-[var(--destructive)] text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 shadow-lg shadow-[var(--destructive)]/20"
              >
                {isSubmitting ? "Submitting..." : "Submit Dispute"}
                {!isSubmitting && <CheckCircle2 size={18} />}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
