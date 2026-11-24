"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export const RECENT_TRACKING_KEY = "trustlink.recent_tracking";
export const MAX_RECENT_TRACKING = 5;

/**
 * Retrieve recent tracking escrow IDs from localStorage safely.
 */
export function getRecentTracking(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_TRACKING_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .slice(0, MAX_RECENT_TRACKING);
  } catch {
    return [];
  }
}

/**
 * Save an escrow ID to recent searches, prepending it and capping at 5 items without duplicates.
 */
export function saveRecentTracking(escrowId: string): string[] {
  if (typeof window === "undefined") return [];
  const trimmed = escrowId.trim();
  if (!trimmed) return getRecentTracking();
  const current = getRecentTracking();
  const updated = [trimmed, ...current.filter((id) => id !== trimmed)].slice(
    0,
    MAX_RECENT_TRACKING
  );
  try {
    window.localStorage.setItem(RECENT_TRACKING_KEY, JSON.stringify(updated));
  } catch {
    // Gracefully handle storage quota or private browsing mode
  }
  return updated;
}

/**
 * Clear all recent tracking search history from localStorage.
 */
export function clearRecentTracking(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(RECENT_TRACKING_KEY);
  } catch {
    // Gracefully handle error
  }
}

export default function TrackingLookupForm() {
  const router = useRouter();
  const [escrowId, setEscrowId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recentLookups, setRecentLookups] = useState<string[]>(() => getRecentTracking());

  const navigateToTrack = (id: string) => {
    const trimmed = id.trim();
    if (!trimmed) return;
    const updated = saveRecentTracking(trimmed);
    setRecentLookups(updated);
    router.push(`/track/${encodeURIComponent(trimmed)}`);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = escrowId.trim();
    if (!trimmed) {
      setError("Please enter a valid escrow ID.");
      return;
    }

    setError(null);
    navigateToTrack(trimmed);
  };

  const handleClearHistory = () => {
    clearRecentTracking();
    setRecentLookups([]);
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:justify-center"
        aria-label="Escrow ID lookup"
      >
        <div className="w-full sm:w-auto">
          <label htmlFor="tracking-escrow-id" className="sr-only">
            Escrow ID
          </label>
          <input
            id="tracking-escrow-id"
            name="escrowId"
            type="text"
            value={escrowId}
            onChange={(e) => {
              setEscrowId(e.target.value);
              if (error) setError(null);
            }}
            placeholder="Enter escrow ID..."
            aria-invalid={error ? "true" : "false"}
            aria-describedby={error ? "tracking-error" : undefined}
            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-zinc-950 placeholder-zinc-400 outline-none transition focus:border-zinc-400 focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:placeholder-zinc-500 dark:focus-visible:ring-zinc-300 sm:w-80"
          />
          {error && (
            <p
              id="tracking-error"
              role="alert"
              className="mt-2 text-left text-sm text-red-600 dark:text-red-400"
            >
              {error}
            </p>
          )}
        </div>
        <button
          type="submit"
          className="w-full self-start rounded-2xl bg-zinc-900 px-6 py-3 font-semibold text-white transition hover:bg-zinc-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 dark:focus-visible:ring-zinc-300 sm:w-auto"
        >
          Track Order
        </button>
      </form>

      {recentLookups.length > 0 && (
        <section
          aria-labelledby="recent-lookups-title"
          className="mx-auto mt-6 max-w-md text-left"
        >
          <div className="flex items-center justify-between border-b border-zinc-200 pb-2 dark:border-zinc-800">
            <h2
              id="recent-lookups-title"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Recent Lookups
            </h2>
            <button
              type="button"
              onClick={handleClearHistory}
              aria-label="Clear history"
              className="rounded text-xs text-zinc-500 underline transition hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              Clear History
            </button>
          </div>
          <ul
            className="mt-3 flex flex-wrap gap-2"
            role="list"
            aria-label="Recent Lookups"
          >
            {recentLookups.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => navigateToTrack(id)}
                  aria-label={`Track ${id}`}
                  className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 font-mono text-xs font-medium text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  {id}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
