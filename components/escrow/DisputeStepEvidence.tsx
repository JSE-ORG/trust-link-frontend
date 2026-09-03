import React, { useEffect, useState } from "react";

import { FormField } from "@/components/ui/FormField";
import type { DisputeFormValues } from "@/lib/validations/dispute";

interface Props {
  formData: DisputeFormValues;
  errors: Partial<Record<keyof DisputeFormValues, string>>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (index: number) => void;
}

const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

function isImageFile(file: File): boolean {
  return IMAGE_MIME_TYPES.includes(file.type);
}

export function DisputeStepEvidence({ formData, errors, handleFileUpload, removeFile }: Props) {
  const [previewUrls, setPreviewUrls] = useState<Record<number, string>>({});

  useEffect(() => {
    const newUrls: Record<number, string> = {};
    formData.files.forEach((file, index) => {
      if (isImageFile(file)) {
        newUrls[index] = URL.createObjectURL(file);
      }
    });
    setPreviewUrls(newUrls);

    return () => {
      Object.values(newUrls).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [formData.files]);
  return (
    <div className="step step-3" data-testid="step-3">
      <h2>Step 3: Upload Evidence</h2>
      <div className="form-group">
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
      </div>

      {formData.files.length > 0 && (
        <div className="mb-5">
          <h4 className="mb-2 font-semibold text-foreground">Uploaded Files:</h4>
          <ul className="list-none space-y-2 p-0">
            {formData.files.map((file, index) => (
              <li
                key={index}
                data-testid={`file-${index}`}
                className="flex items-center gap-3"
              >
                {isImageFile(file) && previewUrls[index] && (
                  <img
                    src={previewUrls[index]}
                    alt={`Preview of ${file.name}`}
                    className="h-16 w-16 rounded object-cover border border-zinc-200 dark:border-zinc-700"
                    data-testid={`preview-${index}`}
                  />
                )}
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
