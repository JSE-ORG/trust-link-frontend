"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/Skeleton";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { Button } from "@/components/ui/button";
import { Copy, Download, X, MessageCircle, Image } from "lucide-react";
import { Copy, Download, X, MessageCircle, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { formatUSDC } from "@/utils/currency";
import { track } from "@/lib/analytics";
import FetchErrorState, { getFetchErrorMessage } from "@/components/ui/FetchErrorState";

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((m) => m.QRCodeSVG),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] w-[200px] animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
    ),
  }
);

async function fetchEscrowLink() {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return {
    title: "Escrow Agreement 1293",
    status: "Active",
    amount: 12450,
    expires: "May 31, 2026",
    escrowId: "1293",
    url: "https://trustlink.example.com/pay/1293",
    imageUrl: undefined, // Optional: Add escrow item image URL here also
  };
}

export default function EscrowLinkCard({
  loading = false,
  onCopySuccess,
  onCopyError,
}: {
  loading?: boolean;
  onCopySuccess?: () => void;
  onCopyError?: (err: Error) => void;
}) {
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
  const [isCopying, setIsCopying] = useState(false);
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const showQRCode = true;

  const copyToClipboard = async (text: string) => {
    if (!navigator.clipboard || !navigator.clipboard.writeText) {
      throw new Error("Clipboard not supported");
    }
    await navigator.clipboard.writeText(text);
  };

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadLink = useCallback(() => {
    setError(null);
    fetchEscrowLink().then(setLink).catch(setError);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadLink();
  }, [loadLink]);

  if (loading) {
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

  if (error) {
    return (
      <FetchErrorState
        title="We couldn't load your shareable link"
        message={getFetchErrorMessage(error, "Failed to load escrow link details.")}
        onRetry={loadLink}
      />
    );
  }

  if (!link) return null;

  const handleCopy = async () => {
    if (isCopying) return;
    
    try {
      setIsCopying(true);
      setErrorMsg(null);
      
      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        throw new Error("Clipboard not supported");
      }
      
      await navigator.clipboard.writeText(link!.url);
      setCopyStatus("success");
      onCopySuccess?.();
      track("link_copied", { method: "copy_button" });
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch (err: unknown) {
      setCopyStatus("error");
      const msg = err instanceof Error ? err.message : "Failed to copy";
      setErrorMsg(msg);
      onCopyError?.(err instanceof Error ? err : new Error(msg));
      setTimeout(() => {
        setCopyStatus("idle");
        setErrorMsg(null);
      }, 2000);
    } finally {
      setIsCopying(false);
    }
  };

  // Share functions for WhatsApp, Instagram, Twitter/X, and QR code download
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
          <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">
            Shareable link ready
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Escrow ID: {link.escrowId}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input
            readOnly
            value={link.url}
            data-testid="escrow-link"
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <span className="sr-only">{link.url}</span>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleCopy}
            disabled={isCopying}
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
            <ImageIcon className="h-4 w-4" />
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

      {copyStatus === "success" && (
        <p className="mt-3 text-sm text-emerald-600" data-testid="copy-success">
          Link copied
        </p>
      )}
      {errorMsg && (
        <p className="mt-3 text-sm text-red-600" data-testid="copy-error">
          {errorMsg}
        </p>
      )}

      {showQRCode && (
        <div className="mt-6 flex justify-center">
          <div className="rounded-3xl border border-zinc-100 bg-white p-4 shadow-inner dark:border-zinc-800">
            <QRCodeSVG
              value={link.url}
              size={160}
              data-testid="qr-code"
              aria-label="QR code for payment"
            />
          </div>
        </div>
      )}
    </div>
  );
}
