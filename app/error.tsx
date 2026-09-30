"use client";

/**
 * Issue #89 — custom 500 error page.
 *
 * Next.js App Router error boundary: rendered when an unhandled error is thrown
 * while rendering a route segment. Provides a retry (re-run the segment via
 * `reset()`) and home navigation, styled to match the 404 page.
 */
import Link from "next/link";
import { useEffect } from "react";

import { captureError } from "@/lib/logger";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error, {
      scope: "ui",
      action: "route-error-boundary",
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <div
      id="error-page"
      className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center min-h-[70vh] bg-[radial-gradient(ellipse_at_50%_0%,color-mix(in_srgb,var(--accent)_8%,transparent)_0%,transparent_70%)]"
    >
      {/* Animated 500 number */}
      <div className="animate-float text-[clamp(6rem,20vw,10rem)] font-extrabold leading-none tracking-[-0.04em] bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent select-none mb-[0.25em]">
        500
      </div>

      {/* Decorative divider */}
      <div className="w-12 h-1 rounded bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] mb-6" />

      {/* Heading */}
      <h1 className="m-0 mb-2 text-[clamp(1.25rem,4vw,1.75rem)] font-bold text-[var(--foreground)] leading-[1.3]">
        Something went wrong
      </h1>

      {/* Description */}
      <p className="m-0 mb-8 max-w-[420px] text-[clamp(0.875rem,2.5vw,1rem)] text-[var(--muted)] leading-relaxed">
        An unexpected error occurred on our end. You can try again, or head back
        home while we sort it out.
      </p>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3 justify-center">
        {/* Retry button */}
        <button
          id="error-retry-button"
          type="button"
          onClick={() => reset()}
          className="inline-flex items-center gap-2 px-[28px] py-[12px] rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] border-none cursor-pointer transition-all duration-200 shadow-[0_4px_14px_color-mix(in_srgb,var(--accent)_30%,transparent)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_color-mix(in_srgb,var(--accent)_40%,transparent)]"
        >
          {/* Refresh icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="23 4 23 10 17 10" />
            <polyline points="1 20 1 14 7 14" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          Try Again
        </button>

        {/* Home button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-[28px] py-[12px] rounded-xl text-sm font-semibold text-[var(--foreground)] bg-[var(--muted-bg)] border-[1.5px] border-[var(--border)] cursor-pointer no-underline transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent)]"
        >
          {/* Home icon */}
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Go Home
        </Link>
      </div>

      {/* Error digest — helps correlate with server logs / Sentry */}
      {error.digest && (
        <p className="mt-6 text-xs text-[var(--muted)] font-mono">
          Error reference: {error.digest}
        </p>
      )}
    </div>
  );
}
