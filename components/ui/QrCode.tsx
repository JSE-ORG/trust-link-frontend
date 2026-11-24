"use client";

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
