"use client";

import dynamic from "next/dynamic";
import React from "react";

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((m) => m.QRCodeSVG),
  {
    ssr: false,
    loading: () => (
      <div className="h-[160px] w-[160px] animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
    ),
  }
);

interface QRCodeComponentProps {
  value: string;
  size?: number;
}

export default function QRCodeComponent({ value, size = 160 }: QRCodeComponentProps) {
  return (
    <div className="rounded-3xl border border-zinc-100 bg-white p-4 shadow-inner dark:border-zinc-800">
      <QRCodeSVG
        value={value}
        size={size}
        data-testid="qr-code"
        aria-label="QR code for link"
      />
    </div>
  );
}
