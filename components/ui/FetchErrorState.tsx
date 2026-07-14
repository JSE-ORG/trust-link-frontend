"use client";

import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function getFetchErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again."
): string {
  return error instanceof Error ? error.message : fallback;
}

interface FetchErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export default function FetchErrorState({
  title = "We couldn't load this content",
  message,
  onRetry,
  retryLabel = "Try again",
  className,
}: FetchErrorStateProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        "flex min-h-[200px] flex-col items-center justify-center gap-4 rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-zinc-900 dark:border-red-500/40 dark:bg-red-950/30 dark:text-zinc-100",
        className
      )}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-200 text-red-700 dark:bg-red-500/20 dark:text-red-200">
        <AlertCircle className="h-8 w-8" aria-hidden="true" />
      </div>
      <div className="max-w-md space-y-3">
        <p className="text-xl font-semibold">{title}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{message}</p>
        {onRetry ? (
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-900 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {retryLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}
