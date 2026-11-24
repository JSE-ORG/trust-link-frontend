"use client";

import { QRCodeSVG } from "qrcode.react";
import React, { useSyncExternalStore } from "react";

const subscribeNever = () => () => {};

export interface QrCodeProps {
  value: string;
  size?: number;
  label?: string;
  className?: string;
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
        data-testid="qr-code-skeleton"
        style={{ width: size, height: size }}
        className="animate-pulse rounded bg-zinc-100 dark:bg-zinc-800"
        aria-hidden="true"
      />
    );
  }

  return (
    <QRCodeSVG
      value={value}
      size={size}
      marginSize={4}
      data-testid="qr-code"
      role="img"
      aria-label={label ?? `QR code for ${value}`}
      className={className}
    />
  );
}
