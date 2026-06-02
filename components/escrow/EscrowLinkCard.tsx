"use client";

import { useEffect, useState, useRef } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { QRCodeCanvas } from "qrcode.react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy, Share2, Download, X, MessageCircle, Instagram } from "lucide-react";
import { toast } from "sonner";
import { formatUSDC } from "@/utils/currency";
import { track } from "@/lib/analytics";

async function fetchEscrowLink() {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return {
    title: "Escrow Agreement 1293",
    status: "Active",
    amount: 12450,
    expires: "May 31, 2026",
    escrowId: "1293",
    url: "https://trustlink.example.com/pay/1293",
    imageUrl: undefined, // Optional: Add escrow item image URL here
  };
}

export default function EscrowLinkCard({ loading = false }: { loading?: boolean }) {
  const [link, setLink] = useState<{
    title: string;
    status: string;
    amount: number;
    expires: string;
    escrowId: string;
    url: string;
    imageUrl?: string;
  } | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    fetchEscrowLink().then(setLink).catch(setError);
  }, []);

  if (error) throw error;

  if (loading || !link) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
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

  const shareWhatsApp = async () => {
    const text = `Check out this secure escrow payment link: ${link.url}`;
    
    // Track analytics
    await track("link_share_attempt", { platform: "whatsapp" });

    // Try native share first on mobile
    if (navigator.share) {
      try {
        await navigator.share({
          title: link.title,
          text: text,
          url: link.url,
        });
        await track("link_shared", { platform: "whatsapp", method: "native" });
        return;
      } catch (err) {
        // User cancelled or share failed, fall through to wa.me
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    }

    // Fallback: Open WhatsApp web/app
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
    await track("link_shared", { platform: "whatsapp", method: "whatsapp_web" });
    toast.success("Opening WhatsApp...");
  };

  const shareInstagram = async () => {
    const igText = `Secure payment link via TrustLink: ${link.url}\n\nCopy and paste in your bio or story!`;
    
    // Track analytics
    await track("link_share_attempt", { platform: "instagram" });

    // Try native share first on mobile
    if (navigator.share) {
      try {
        await navigator.share({
          title: link.title,
          text: igText,
          url: link.url,
        });
        await track("link_shared", { platform: "instagram", method: "native" });
        return;
      } catch (err) {
        // User cancelled or share failed, fall through to clipboard
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    }

    // Fallback: Copy to clipboard
    await copyToClipboard(igText);
    await track("link_shared", { platform: "instagram", method: "clipboard" });
    toast.success("Instagram share text copied!");
  };

  const copyTwitter = async () => {
    const xUrl = `${link.url}?utm_source=twitter&utm_medium=share`;
    const text = `Pay securely via TrustLink escrow: ${link.title} (${link.amount}) ${xUrl}`;
    await navigator.clipboard.writeText(text);
    await track("link_copied", { platform: "twitter" });
    toast.success("Tweet text copied!");
  };

  const downloadQR = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pngUrl = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = pngUrl;
    a.download = `escrow_${link.escrowId}.png`;
    a.click();
    await track("qr_code_downloaded", { escrowId: link.escrowId });
    toast.success("QR code downloaded");
  };

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      {/* Optional Escrow Item Image */}
      {link.imageUrl && (
        <div className="mb-4 overflow-hidden rounded-2xl">
          <OptimizedImage
            src={link.imageUrl}
            alt={`Image of ${link.title}`}
            width={600}
            height={400}
            className="h-48 w-full object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
          />
        </div>
      )}

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">{link.title}</h2>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {link.status}
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Amount</p>
          <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">{formatUSDC(link.amount)}</p>
        </div>
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Expires</p>
          <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">{link.expires}</p>
        </div>
      </div>

      {/* Shareable Link Section */}
      <div className="mt-6 space-y-3">
        <Input readOnly value={link.url} className="font-mono" />
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => {
              copyToClipboard(link.url);
              track("link_copied", { method: "copy_button" });
            }} 
            aria-label="Copy URL"
            title="Copy link to clipboard"
          >
            <Copy className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={shareWhatsApp} 
            aria-label="Share on WhatsApp"
            title="Share on WhatsApp"
            className="hover:bg-green-50 dark:hover:bg-green-950"
          >
            <MessageCircle className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={shareInstagram} 
            aria-label="Share on Instagram"
            title="Share on Instagram"
            className="hover:bg-pink-50 dark:hover:bg-pink-950"
          >
            <Instagram className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={copyTwitter} 
            aria-label="Copy for Twitter/X" 
            title="Copy for Twitter/X"
          >
            <X className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            onClick={downloadQR} 
            aria-label="Download QR"
            title="Download QR code"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* QR Code — sized correctly for mobile scanning */}
      <div className="mt-4 flex justify-center">
        <QRCodeCanvas
          ref={canvasRef}
          value={link.url}
          size={200}
          marginSize={2}
        />
      </div>
    </div>
  );
}
