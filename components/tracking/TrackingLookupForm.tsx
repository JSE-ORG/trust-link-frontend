"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";

export default function TrackingLookupForm() {
  const router = useRouter();
  const [escrowId, setEscrowId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = escrowId.trim();
    if (!trimmed) {
      setError("Please enter a valid escrow ID.");
      return;
    }

    setError(null);
    router.push(`/track/${encodeURIComponent(trimmed)}`);
  };

  return (
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
  );
}
