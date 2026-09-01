import React from "react";

import { FormField } from "@/components/ui/FormField";
import type { DisputeFormValues } from "@/lib/validations/dispute";

interface Props {
  formData: DisputeFormValues;
  errors: Partial<Record<keyof DisputeFormValues, string>>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
}

const inputClass =
  "w-full rounded border border-zinc-300 bg-white p-2.5 text-base text-foreground outline-none transition focus:border-success dark:border-zinc-700 dark:bg-zinc-900";

export function DisputeStepEvidence({ formData, errors, handleFileUpload, removeFile }: Props) {
  return (
    <div data-testid="step-3">
      <h2 className="mb-4 text-xl font-semibold text-foreground">Step 3: Upload Evidence</h2>
      <FormField
        id="files"
        label="Upload Supporting Documents *"
        error={errors.files as string | undefined}
        hint="Accepted formats: JPEG, PNG, WebP, PDF (Max 10MB each)"
      >
        <input
          id="files"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
          onChange={handleFileUpload}
          aria-label="upload files"
          data-testid="file-input"
          className={inputClass}
        />
      </FormField>

      {formData.files.length > 0 && (
        <div className="mb-5">
          <h4 className="mb-2 font-semibold text-foreground">Uploaded Files:</h4>
          <ul className="list-none space-y-2 p-0">
            {formData.files.map((file, index) => (
              <li
                key={index}
                data-testid={`file-${index}`}
                className="flex items-center justify-between rounded border border-zinc-300 bg-zinc-50 p-2.5 text-sm text-foreground dark:border-zinc-700 dark:bg-zinc-800"
              >
                <span>
                  {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      removeFile(index);
                    }
                  }}
                  aria-label={`Delete ${file.name}`}
                  data-testid={`delete-file-${index}`}
                  className="ml-2 cursor-pointer rounded bg-destructive px-2.5 py-1 text-sm text-white transition-colors hover:bg-red-700"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
