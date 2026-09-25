import React, { useEffect, useRef } from "react";

import { FormField } from "@/components/ui/FormField";
import type { DisputeFormValues } from "@/lib/validations/dispute";

/**
 * Props for {@link DisputeStepEvidence}.
 *
 * All state is owned by the parent dispute form (see `useDisputeFormState`);
 * this step is a controlled, presentational view over it.
 */
export interface DisputeStepEvidenceProps {
  /** Current dispute form values. Only `files` is read by this step. */
  formData: DisputeFormValues;
  /**
   * Validation messages keyed by form field. Only `errors.files` is shown
   * here; when present it replaces the accepted-formats hint.
   */
  errors: Partial<Record<keyof DisputeFormValues, string>>;
  /**
   * Called when the user picks files with the file input. The parent is
   * responsible for type/size validation and for appending to `formData.files`.
   */
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /**
   * Removes the file at `index` from `formData.files`. Triggered by the
   * file's "Remove" button (click, Enter or Space).
   */
  removeFile: (index: number) => void;
}

/** MIME types that get an inline thumbnail preview. PDFs are listed without one. */
const IMAGE_MIME_TYPES: readonly string[] = ["image/jpeg", "image/png", "image/jpg", "image/webp"];

/**
 * Returns `true` when the file's MIME type is one we can render as a thumbnail.
 *
 * @param file - An uploaded evidence file.
 */
function isImageFile(file: File): boolean {
  return IMAGE_MIME_TYPES.includes(file.type);
}

/**
 * Formats a byte count as kilobytes with one decimal place, e.g. `1536` → `"1.5 KB"`.
 *
 * @param bytes - File size in bytes.
 */
function formatFileSize(bytes: number): string {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

const inputClass =
  "w-full rounded border border-zinc-300 bg-white p-2.5 text-base text-foreground outline-none transition focus:border-success dark:border-zinc-700 dark:bg-zinc-900";

/** Props for {@link ImagePreview}. */
interface ImagePreviewProps {
  /** The image file to preview. */
  file: File;
  /** Position of the file in the upload list, used for the test id. */
  index: number;
}

/**
 * Thumbnail for a single uploaded image.
 *
 * The blob URL is created in an effect and written straight to the `<img>`
 * element instead of being stored in React state. That avoids an extra render
 * pass (the `set-state-in-effect` anti-pattern) and ties the URL's lifetime to
 * this element: it is revoked when the file changes or the thumbnail unmounts,
 * so no blob URLs leak, including under Strict Mode's double-invoked effects.
 * The fixed `h-16 w-16` box means setting `src` never shifts layout.
 */
function ImagePreview({ file, index }: ImagePreviewProps) {
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    const url = URL.createObjectURL(file);
    img.src = url;

    return () => {
      img.removeAttribute("src");
      URL.revokeObjectURL(url);
    };
  }, [file]);

  return (
    // eslint-disable-next-line @next/next/no-img-element -- blob: URLs can't go through next/image
    <img
      ref={imgRef}
      alt={`Preview of ${file.name}`}
      className="h-16 w-16 rounded object-cover border border-zinc-200 dark:border-zinc-700"
      data-testid={`preview-${index}`}
    />
  );
}

/**
 * Step 3 of the dispute form: evidence upload.
 *
 * Renders a multi-file input (JPEG, PNG, WebP, PDF) and, once files are
 * attached, a list showing each file's name and size with a "Remove" button.
 * Image files additionally get a thumbnail preview.
 *
 * @example
 * ```tsx
 * <DisputeStepEvidence
 *   formData={formData}
 *   errors={errors}
 *   handleFileUpload={handleFileUpload}
 *   removeFile={removeFile}
 * />
 * ```
 */
export function DisputeStepEvidence({
  formData,
  errors,
  handleFileUpload,
  removeFile,
}: DisputeStepEvidenceProps) {
  return (
    <div className="step step-3" data-testid="step-3">
      <h2>Step 3: Upload Evidence</h2>
      <div className="form-group">
        <FormField
          id="files"
          label="Upload Supporting Documents *"
          error={errors.files}
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
          <h3 className="mb-2 font-semibold text-foreground">Uploaded Files:</h3>
          <ul className="list-none space-y-2 p-0">
            {formData.files.map((file, index) => (
              <li
                key={index}
                data-testid={`file-${index}`}
                className="flex items-center gap-3"
              >
                {isImageFile(file) && <ImagePreview file={file} index={index} />}
                <span>
                  {file.name} ({formatFileSize(file.size)})
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
