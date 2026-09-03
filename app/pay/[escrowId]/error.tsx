'use client';

import React, { useEffect } from 'react';
import { ErrorBoundary } from '@/components/layout/ErrorBoundary';

interface RouteErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function RouteGroupErrorBoundary({ error, reset }: RouteErrorProps) {
  useEffect(() => {
    // Log the error securely to the console for easier workspace debugging
    console.error('Route Group Level Error Captured:', error);
  }, [error]);

  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center p-6 text-center">
      <ErrorBoundary error={error}>
        <div className="mt-4">
          <button
            onClick={() => reset()}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Try again
          </button>
        </div>
      </ErrorBoundary>
    </div>
  );
}
