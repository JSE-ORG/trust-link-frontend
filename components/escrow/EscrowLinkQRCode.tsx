import type { RefObject } from "react";

import { QrCode } from "@/components/ui/QrCode";

export interface EscrowLinkQRCodeProps {
  url: string;
  qrRef?: RefObject<HTMLDivElement | null>;
  size?: number;
  label?: string;
}

export default function EscrowLinkQRCode({
  url,
  qrRef,
  size = 160,
  label = "QR code for payment",
}: EscrowLinkQRCodeProps) {
  return (
    <div className="mt-6 flex justify-center">
      <div
        ref={qrRef}
        className="rounded-3xl border border-zinc-100 bg-white p-4 shadow-inner dark:border-zinc-800"
      >
        <QrCode value={url} size={size} label={label} />
      </div>
    </div>
  );
}
