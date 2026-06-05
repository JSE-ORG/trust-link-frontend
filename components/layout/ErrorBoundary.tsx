"use client";

import { Component, type ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";

interface ErrorBoundaryState {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<
  { children: ReactNode },
  ErrorBoundaryState
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    Sentry.captureException(error, { extra: { errorInfo } });
  }

  resetError = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 rounded-3xl border border-red-200 bg-red-50 p-8 text-center text-zinc-900 dark:border-red-500/40 dark:bg-red-950/30 dark:text-zinc-100">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-200 text-red-700 dark:bg-red-500/20 dark:text-red-200">
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M11.001 10h2v5h-2zm0 7h2v2h-2z" />
              <path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm0 18c-4.411 0-8-3.589-8-8s3.589-8 8-8 8 3.589 8 8-3.589 8-8 8z" />
            </svg>
          </div>
          <div className="max-w-md space-y-3">
            <p className="text-xl font-semibold">Something went wrong</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              We couldn’t load this section. Please try again and the page should recover.
            </p>
            <button
              type="button"
              onClick={this.resetError}
              className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-900"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
