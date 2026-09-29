import React from "react";

interface FormFieldProps {
  label: string;
  id: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  id,
  error,
  hint,
  children,
}: FormFieldProps) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(
            child as React.ReactElement<{
              "aria-invalid"?: boolean;
              "aria-describedby"?: string;
            }>,
            {
              "aria-invalid": Boolean(error),
              "aria-describedby": describedBy,
            }
          );
        }
        return child;
      })}
      {hint && !error ? (
        <small
          id={hintId}
          className="mt-2 block text-sm text-zinc-600 dark:text-zinc-400"
        >
          {hint}
        </small>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
