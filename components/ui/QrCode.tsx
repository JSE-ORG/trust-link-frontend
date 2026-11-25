"use client";

import { QRCodeSVG } from "qrcode.react";
import React, { useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

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

export function QrCode({
  value,
  size = 192,
  label,
  className,
}: QrCodeProps) {
  // False during server render and hydration, true once mounted on the client,
  // so the QR code never causes a hydration mismatch.
  const mounted = useSyncExternalStore(subscribeNever, () => true, () => false);

  if (!mounted) {
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
