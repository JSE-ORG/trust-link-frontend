"use client";

import { useEffect } from "react";

import { captureError } from "@/lib/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    captureError(error, {
      scope: "ui",
      action: "global-error-boundary",
      extra: { digest: error.digest },
    });
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center font-sans">
          <h1 className="text-3xl font-bold mb-2">
            Something went wrong
          </h1>
          <p className="text-[#666] mb-6">
            An unexpected error occurred. Please try again.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="px-6 py-2.5 rounded-lg bg-[#1B2A6B] text-white border-0 cursor-pointer font-semibold"
          >
            Try Again
          </button>
          {error.digest && (
            <p className="mt-4 text-xs text-[#999] font-mono">
              Error reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
