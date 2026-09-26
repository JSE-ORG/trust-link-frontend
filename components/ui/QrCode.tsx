"use client";

import React, { useMemo } from "react";

import { buildQrMatrix } from "@/lib/utils/qrcode";

export function QrCode({ value }: { value: string }) {
  const matrix = useMemo(() => buildQrMatrix(value), [value]);

  return (
    <svg
      data-testid="qr-code"
      role="img"
      aria-label={`QR code for ${value}`}
      viewBox="0 0 21 21"
      className="h-48 w-48 rounded-3xl border border-zinc-200 bg-white p-3 shadow-inner dark:border-zinc-800"
      shapeRendering="crispEdges"
    >
      <rect width="21" height="21" fill="white" />
      {matrix.map((row, y) =>
        row.map((filled, x) =>
          filled ? (
            <rect
              key={`${x}-${y}`}
              x={x}
              y={y}
              width="1"
              height="1"
              fill="black"
            />
          ) : null
        )
      )}
    </svg>
  );
}
