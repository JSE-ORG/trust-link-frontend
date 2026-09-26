"use client";

import type { RefObject } from "react";

import { QrCode } from "@/components/ui/QrCode";

const actionButtonClassName =
  "rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-white dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-950";

interface EscrowCreateFormResultProps {
  resultUrl: string;
  copyStatus: string | null;
  onCopy: () => void;
  onDownloadQR: () => void;
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

/** Post-submission card exposing the shareable escrow link, QR code, and share actions. */
export function EscrowCreateFormResult({
  resultUrl,
  copyStatus,
  onCopy,
  onDownloadQR,
  canvasRef,
}: EscrowCreateFormResultProps) {
  return (
    <section
      data-testid="link-card"
      className="mt-8 rounded-[28px] border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/60 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Shareable link ready
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Copy this URL or scan the QR code to share it with a buyer.
          </p>
        </div>
        <button
          type="button"
          onClick={onCopy}
          className={actionButtonClassName}
        >
          Copy link
        </button>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(`Pay securely for your order using TrustLink: ${resultUrl}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className={`inline-flex items-center gap-2 ${actionButtonClassName}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Share on WhatsApp
        </a>
      </div>

      <div className="mt-5">
        <label
          htmlFor="shareable-url"
          className="mb-2 block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Shareable URL
        </label>
        <input
          id="shareable-url"
          data-testid="shareable-url"
          readOnly
          value={resultUrl}
          className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 font-mono text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
        />
        {copyStatus ? (
          <p className="mt-2 text-sm text-emerald-600">{copyStatus}</p>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col items-center gap-3">
        <QrCode value={resultUrl} />
        <canvas ref={canvasRef} className="sr-only" aria-hidden="true" />
        <button
          type="button"
          onClick={onDownloadQR}
          className={actionButtonClassName}
        >
          Download QR
        </button>
      </div>
    </section>
  );
}
