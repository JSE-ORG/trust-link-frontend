"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

import { Skeleton } from "@/components/ui/Skeleton";

export interface ParsePaymentInputResult {
  ok: boolean;
  path?: string;
  error?: string;
}

/**
 * Validates and normalizes user input on the generic payment landing page.
 * Accepts:
 *   - Plain escrow IDs (e.g. "escrow-123", "1293")
 *   - Same-site relative payment paths (e.g. "/pay/escrow-123", "pay/escrow-123")
 *   - Same-site absolute URLs (e.g. "https://trustlink.app/pay/escrow-123")
 *
 * Rejects blank inputs, external links, and malformed inputs with actionable feedback.
 */
export function parsePaymentInput(
  input: string,
  currentOrigin?: string
): ParsePaymentInputResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      ok: false,
      error: "Please enter an escrow ID or payment link.",
    };
  }

  // 1. Absolute URL or protocol-relative URL
  if (/^(?:[a-z+.-]+:|\/\/)/i.test(trimmed)) {
    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      return {
        ok: false,
        error: "The provided payment link is malformed.",
      };
    }

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return {
        ok: false,
        error: "The provided payment link is malformed.",
      };
    }

    const origin =
      currentOrigin ??
      (typeof window !== "undefined" ? window.location.origin : "");
    const configuredSite = process.env.NEXT_PUBLIC_SITE_URL
      ? new URL(process.env.NEXT_PUBLIC_SITE_URL).origin
      : "";

    const isSameSite =
      (Boolean(origin) && url.origin === origin) ||
      (Boolean(configuredSite) && url.origin === configuredSite);

    if (!isSameSite) {
      return {
        ok: false,
        error:
          "External payment links are not allowed. Please enter an escrow ID or same-site link.",
      };
    }

    const match = url.pathname.match(/^\/pay\/([^/]+)$/);
    if (!match) {
      return {
        ok: false,
        error: "Please provide a valid payment link in the format /pay/{id}.",
      };
    }

    const id = decodeURIComponent(match[1]).trim();
    if (!id) {
      return {
        ok: false,
        error: "The payment link is missing an escrow ID.",
      };
    }

    return {
      ok: true,
      path: `/pay/${encodeURIComponent(id)}`,
    };
  }

  // 2. Relative path starting with '/'
  if (trimmed.startsWith("/")) {
    let url: URL;
    try {
      url = new URL(trimmed, "http://localhost");
    } catch {
      return {
        ok: false,
        error: "The provided payment link is malformed.",
      };
    }

    const match = url.pathname.match(/^\/pay\/([^/]+)$/);
    if (!match) {
      return {
        ok: false,
        error: "Please provide a valid payment link in the format /pay/{id}.",
      };
    }

    const id = decodeURIComponent(match[1]).trim();
    if (!id) {
      return {
        ok: false,
        error: "The payment link is missing an escrow ID.",
      };
    }

    return {
      ok: true,
      path: `/pay/${encodeURIComponent(id)}`,
    };
  }

  // 3. Short path starting with 'pay/'
  if (/^pay\//i.test(trimmed)) {
    const afterPay = trimmed.slice(4).trim();
    if (!afterPay || afterPay.includes("/")) {
      return {
        ok: false,
        error: "Please provide a valid payment link in the format /pay/{id}.",
      };
    }
    return {
      ok: true,
      path: `/pay/${encodeURIComponent(afterPay)}`,
    };
  }

  // 4. Treat as plain Escrow ID
  if (
    /\s/.test(trimmed) ||
    trimmed.includes("/") ||
    trimmed.includes("\\") ||
    trimmed.includes("?") ||
    trimmed.includes("#")
  ) {
    return {
      ok: false,
      error: "The escrow ID is malformed. Please enter a valid identifier.",
    };
  }

  return {
    ok: true,
    path: `/pay/${encodeURIComponent(trimmed)}`,
  };
}

export default function PaymentSection({
  loading = false,
}: {
  loading?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div
        className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
        role="status"
        aria-label="Loading payment section"
      >
        <Skeleton className="mb-4 h-6 w-1/3" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </div>
    );
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = parsePaymentInput(value);
    if (!result.ok) {
      setError(result.error ?? "Invalid input.");
      return;
    }

    setError(null);
    if (result.path) {
      router.push(result.path);
    }
  };

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <h2 className="text-xl font-semibold text-zinc-950 dark:text-zinc-100">
        Open Escrow Payment
      </h2>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Enter an escrow ID or same-site payment link to view and complete your escrow payment.
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start"
        aria-label="Open payment link"
      >
        <div className="w-full flex-1">
          <label htmlFor="payment-input" className="sr-only">
            Escrow ID or payment link
          </label>
          <input
            id="payment-input"
            name="paymentInput"
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. escrow-123 or /pay/escrow-123"
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? "payment-input-error" : undefined}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 placeholder-zinc-400 outline-none transition focus:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus-visible:ring-zinc-300"
          />
          {error && (
            <p
              id="payment-input-error"
              role="alert"
              className="mt-2 text-sm text-red-600 dark:text-red-400"
            >
              {error}
            </p>
          )}
        </div>
        <button
          type="submit"
          className="w-full rounded-2xl bg-zinc-900 px-6 py-3 font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-300 sm:w-auto"
        >
          Open Payment
        </button>
      </form>
    </div>
  );
}
