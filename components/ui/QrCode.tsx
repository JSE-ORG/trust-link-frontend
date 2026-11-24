"use client";

import dynamic from "next/dynamic";
import * as React from "react";

import { cn } from "@/lib/utils";

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((mod) => ({ default: mod.QRCodeSVG })),
  {
    ssr: false,
    loading: () => (
      <div
        data-testid="qr-code-skeleton"
        className="h-[160px] w-[160px] animate-pulse rounded bg-zinc-100 dark:bg-zinc-800"
        aria-hidden="true"
      />
    ),
  }
);

export interface QrCodeProps {
  /** URL or text payload encoded into the QR code. */
  value: string;
  /** Width and height of the rendered QR code in pixels. Defaults to `160`. */
  size?: number;
  /** Accessible label for the rendered QR image (`aria-label`). */
  label?: string;
  /** Optional class names applied to the QR container element. */
  className?: string;
  /** When `true`, renders a loading skeleton placeholder instead of the QR SVG. */
  showSkeleton?: boolean;
}

/**
 * Canonical QR code primitive backed by `qrcode.react` (`QRCodeSVG`) with
 * client-only dynamic loading (`ssr: false`) to prevent hydration mismatches.
 *
 * Forwards a `div` ref so callers can reliably query the underlying `<svg>`
 * element via `ref.current?.querySelector("svg")` for PNG export.
 */
export const QrCode = React.forwardRef<HTMLDivElement, QrCodeProps>(
  function QrCode(
    {
      value,
      size = 160,
      label,
      className,
      showSkeleton = false,
    },
    ref
  ) {
    return (
      <div
        ref={ref}
        className={cn("inline-flex items-center justify-center", className)}
      >
        {showSkeleton ? (
          <div
            data-testid="qr-code-skeleton"
            style={{ width: size, height: size }}
            className="animate-pulse rounded bg-zinc-100 dark:bg-zinc-800"
            aria-hidden="true"
          />
        ) : (
          <QRCodeSVG
            value={value}
            size={size}
            marginSize={4}
            data-testid="qr-code"
            role="img"
            aria-label={label ?? `QR code for ${value}`}
          />
        )}
      </div>
    );
  }
);

QrCode.displayName = "QrCode";
