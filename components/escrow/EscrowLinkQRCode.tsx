import dynamic from "next/dynamic";

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((m) => m.QRCodeSVG),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] w-[200px] animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
    ),
  }
);

interface EscrowLinkQRCodeProps {
  url: string;
}

export default function EscrowLinkQRCode({ url }: EscrowLinkQRCodeProps) {
  return (
    <div className="mt-6 flex justify-center">
      <div className="rounded-3xl border border-zinc-100 bg-white p-4 shadow-inner dark:border-zinc-800">
        <QRCodeSVG
          value={url}
          size={160}
          data-testid="qr-code"
          aria-label="QR code for payment"
        />
      </div>
    </div>
  );
}
