"use client";

import React from "react";

import { QrCode } from "./QrCode";

export interface QRCodeComponentProps {
  value: string;
  size?: number;
  label?: string;
}

export default function QRCodeComponent({
  value,
  size = 160,
  label = "QR code for link",
}: QRCodeComponentProps) {
  return (
    <div className="rounded-3xl border border-zinc-100 bg-white p-4 shadow-inner dark:border-zinc-800">
      <QrCode value={value} size={size} label={label} />
    </div>
  );
}
