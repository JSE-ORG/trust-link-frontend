"use client";

import { forwardRef,InputHTMLAttributes } from "react";

/**
 * Props for the Input component.
 * Extends all native `<input>` attributes so callers can pass any standard
 * prop (type, placeholder, value, onChange, etc.) while keeping IntelliSense
 * and ref-forwarding support.
 */
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Additional classes appended to the base input styles. */
  className?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={`flex h-10 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-zinc-300 ${className}`}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export { Input };
