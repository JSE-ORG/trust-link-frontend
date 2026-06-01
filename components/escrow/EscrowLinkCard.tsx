"use client";

import { useEffect, useState, useRef } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import QRCode from "qrcode.react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Share2, Download } from "lucide-react";
import { toast } from "sonner";

// Mock fetch – replace with real API when available
async function fetchEscrowLink() {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return {
    title: "Escrow Agreement 1293",
    status: "Active",
    amount: "$12,450",
    expires: "May 31, 2026",
    url: "https://trustlink.example.com/escrow/1293",
  };
}

export default function EscrowLinkCard({ loading = false }: { loading?: boolean }) {
  const [link, setLink] = useState<
    | {
        title: string;
        status: string;
        amount: string;
        expires: string;
        url: string;
      }
    | null
  >(null);
  const [error, setError] = useState<Error | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchEscrowLink()
      .then(setLink)
      .catch(setError);
  }, []);

  if (error) throw error;

  if (loading || !link) {
    return (
      <div className="rounded-3xl border border-border bg-background p-6 shadow-sm">
        <Skeleton className="mb-4 h-6 w-2/3" />
        <Skeleton className="mb-4 h-4 w-1/2" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-3xl" />
          <Skeleton className="h-12 w-full rounded-3xl" />
        </div>
      </div>
    );
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const copyInstagram = async () => {
    const igUrl = `${link.url}?utm_source=instagram&utm_medium=share`;
    await copyToClipboard(igUrl);
    toast.success("Instagram link copied!");
  };

  const shareWhatsApp = () => {
    const waUrl = `https://wa.me/?text=${encodeURIComponent(link.url)}`;
    window.open(waUrl, "_blank");
  };

  const downloadQR = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = "escrow_qr.png";
    a.click();
    toast.success("QR code downloaded");
  };

  return (
    <div className="rounded-3xl border border-border bg-background p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">{link.title}</h2>
        <span className="rounded-full bg-muted-bg px-3 py-1 text-sm text-foreground">
          {link.status}
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted">Amount</p>
          <p className="mt-1 text-base font-medium text-foreground">{link.amount}</p>
        </div>
        <div>
          <p className="text-sm text-muted">Expires</p>
          <p className="mt-1 text-base font-medium text-foreground">{link.expires}</p>
        </div>
      </div>

      {/* Shareable Link Section */}
      <div className="mt-6 space-y-3">
        <Input readOnly value={link.url} className="font-mono" />
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => copyToClipboard(link.url)} aria-label="Copy URL">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={shareWhatsApp} aria-label="Share on WhatsApp">
            <Share2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={copyInstagram} aria-label="Copy for Instagram">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={downloadQR} aria-label="Download QR">
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* QR Code */}
      <div className="mt-4 flex justify-center">
        <QRCode
          value={link.url}
          size={180}
          renderAs="canvas"
          ref={canvasRef as any}
        />
      </div>
    </div>
  );
}
