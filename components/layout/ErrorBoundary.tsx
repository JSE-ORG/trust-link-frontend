"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

import { captureError } from "@/lib/logger";

/** Props accepted by {@link ErrorBoundary}. */
interface ErrorBoundaryProps {
  /** Subtree to render normally when no error has been caught. */
  children: ReactNode;
}

/** Internal render state tracked by {@link ErrorBoundary}. */
interface ErrorBoundaryState {
  /** Whether a descendant has thrown and the fallback UI should render. */
  hasError: boolean;
}

/**
 * Class-based React error boundary for the layout tree.
 *
 * Catches render/lifecycle errors thrown by its children, reports them via
 * {@link captureError}, and renders a fallback panel with a "Try Again"
 * control that resets the boundary so the subtree can attempt to re-render.
 */
export default class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false };

  /** React lifecycle hook: derive fallback state from a thrown error. */
  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  /** React lifecycle hook: reports the caught error for observability. */
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    captureError(error, {
      scope: "ui",
      action: "ErrorBoundary",
      extra: { errorInfo },
    });
  }

  /** Clears the error state so the wrapped subtree is given another render attempt. */
  resetError = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
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
