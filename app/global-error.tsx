"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
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
    <html lang="en">
      <body>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100vh",
            padding: "24px",
            textAlign: "center",
            fontFamily: "sans-serif",
          }}
        >
          <h1 style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "8px" }}>
            Something went wrong
          </h1>
          <p style={{ color: "#666", marginBottom: "24px" }}>
            An unexpected error occurred. Please try again.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: "10px 24px",
              borderRadius: "8px",
              background: "#1B2A6B",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Try Again
          </button>
          {error.digest && (
            <p style={{ marginTop: "16px", fontSize: "12px", color: "#999", fontFamily: "monospace" }}>
              Error reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
