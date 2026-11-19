"use client";

import { useEffect } from "react";

import FetchErrorState from "@/components/ui/FetchErrorState";

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
  /** Next.js retries server requests as well as resetting the boundary. */
  unstable_retry?: () => void;
}

export default function RouteGroupErrorBoundary({ error, reset, unstable_retry }: RouteErrorProps) {
  useEffect(() => {
    console.error("Payment route error:", error);
  }, [error]);

  return (
    <div className="min-h-screen min-h-dvh bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-4xl">
        <FetchErrorState
          title="Unable to load payment"
          message="We couldn’t load the escrow details. Please try again. If the problem continues, contact support."
          onRetry={unstable_retry ?? reset}
        />
      </div>
    </div>
  );
}
