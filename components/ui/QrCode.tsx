"use client";

import React, { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
