"use client";

/**
 * Issue #89 — custom 500 error page.
 *
 * Next.js App Router error boundary: rendered when an unhandled error is thrown
 * while rendering a route segment. Provides a retry (re-run the segment via
 * `reset()`) and home navigation, styled to match the 404 page.
 */
import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div
      id="error-page"
      className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center"
      style={{
        minHeight: "70vh",
        background:
          "radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--accent) 8%, transparent) 0%, transparent 70%)",
      }}
    >
      {/* Animated 500 number */}
      <div
        className="animate-float"
        style={{
          fontSize: "clamp(6rem, 20vw, 10rem)",
          fontWeight: 800,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          background:
            "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          userSelect: "none",
          marginBottom: "0.25em",
        }}
      >
        500
      </div>

      {/* Decorative divider */}
      <div
        style={{
          width: 48,
          height: 4,
          borderRadius: 2,
          background: "linear-gradient(90deg, var(--primary), var(--accent))",
          marginBottom: 24,
        }}
      />

      {/* Heading */}
      <h1
        style={{
          margin: "0 0 8px",
          fontSize: "clamp(1.25rem, 4vw, 1.75rem)",
          fontWeight: 700,
          color: "var(--foreground)",
          lineHeight: 1.3,
        }}
      >
        Something went wrong
      </h1>

      {/* Description */}
      <p
        style={{
          margin: "0 0 32px",
          maxWidth: 420,
          fontSize: "clamp(0.875rem, 2.5vw, 1rem)",
          color: "var(--muted)",
          lineHeight: 1.6,
        }}
      >
        An unexpected error occurred on our end. You can try again, or head back
        home while we sort it out.
      </p>

      {/* Action buttons */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 12,
          justifyContent: "center",
        }}
      >
        {/* Retry button */}
        <button
          id="error-retry-button"
          type="button"
          onClick={() => reset()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 28px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            color: "#ffffff",
            background:
              "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
            border: "none",
            cursor: "pointer",
            transition: "transform 0.2s, box-shadow 0.2s",
            boxShadow:
              "0 4px 14px color-mix(in srgb, var(--accent) 30%, transparent)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 6px 20px color-mix(in srgb, var(--accent) 40%, transparent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 4px 14px color-mix(in srgb, var(--accent) 30%, transparent)";
          }}
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
          id="error-home-link"
          href="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 28px",
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 600,
            color: "var(--foreground)",
            background: "var(--muted-bg)",
            border: "1.5px solid var(--border)",
            cursor: "pointer",
            textDecoration: "none",
            transition: "transform 0.2s, border-color 0.2s, background 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.borderColor = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.borderColor = "var(--border)";
          }}
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
        <p
          style={{
            marginTop: 24,
            fontSize: 12,
            color: "var(--muted)",
            fontFamily: "monospace",
          }}
        >
          Error reference: {error.digest}
        </p>
      )}
    </div>
  );
}
