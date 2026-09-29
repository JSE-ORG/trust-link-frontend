"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NotFoundClient() {
  const router = useRouter();

  return (
    <div
      id="not-found-page"
      className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center min-h-[70vh] bg-[radial-gradient(ellipse_at_50%_0%,color-mix(in_srgb,var(--accent)_8%,transparent)_0%,transparent_70%)]"
    >
      <div className="animate-float text-[clamp(6rem,20vw,10rem)] font-extrabold leading-none tracking-[-0.04em] bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] bg-clip-text text-transparent select-none mb-[0.25em]">
        404
      </div>

      <div className="w-12 h-1 rounded bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] mb-6" />

      <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] mb-3">
        Page not found
      </h1>

      <p className="max-w-sm text-base leading-relaxed text-[var(--muted-foreground)] mb-8">
        The page you&apos;re looking for doesn&apos;t exist or has been
        moved. Let&apos;s get you back on track.
      </p>

      <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md bg-gradient-to-br from-[var(--primary)] to-[var(--accent)]"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Home
        </Link>

        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] text-[var(--foreground)] bg-[var(--card)] px-6 py-3 text-sm font-semibold shadow-sm transition-all hover:shadow-md"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Go Back
        </button>
      </div>
    </div>
  );
}
