"use client";

import {
  Copy,
  Download,
  Image as ImageIcon,
  MessageCircle,
  Share2,
  X,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback,useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import FetchErrorState, {
  getFetchErrorMessage,
} from "@/components/ui/FetchErrorState";
import OptimizedImage from "@/components/ui/OptimizedImage";
import { Skeleton } from "@/components/ui/Skeleton";
import { track } from "@/lib/analytics";
import { formatUSDC } from "@/utils/currency";

const QRCodeSVG = dynamic(
  () => import("qrcode.react").then((m) => m.QRCodeSVG),
  {
    ssr: false,
    loading: () => (
      <div className="h-[200px] w-[200px] animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" />
    ),
  }
);

/** Copy text to the system clipboard. Throws if the Clipboard API is unavailable. */
async function copyToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    throw new Error("Clipboard not supported");
  }
  await navigator.clipboard.writeText(text);
}

/** Fetch escrow link details from the API. Currently returns mock data. */
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

/** Props for the EscrowLinkCard component. */
interface EscrowLinkCardProps {
  /** When true, renders a skeleton loading placeholder instead of the card. */
  loading?: boolean;
  /** Callback invoked after a successful clipboard copy. */
  onCopySuccess?: () => void;
  /** Callback invoked when a clipboard copy attempt fails. */
  onCopyError?: (err: Error) => void;
}

/**
 * Displays an escrow payment link card with QR code, share buttons,
 * and copy functionality. Fetches link details on mount and provides
 * sharing via WhatsApp, Instagram, Twitter/X, and native share API.
 */
export default function EscrowLinkCard({
  loading = false,
  onCopySuccess,
  onCopyError,
}: EscrowLinkCardProps) {
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
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const showQRCode = true;

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const canShare = typeof navigator !== "undefined" && Boolean(navigator.share);

  const loadLink = useCallback(() => {
    setError(null);
    fetchEscrowLink().then(setLink).catch(setError);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchEscrowLink()
      .then((data) => {
        if (!cancelled) setLink(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
        message={getFetchErrorMessage(
          error,
          "Failed to load escrow link details."
        )}
        onRetry={loadLink}
      />
    );
  }

  if (!link) return null;

  const handleNativeShare = async () => {
    if (!navigator.share || !link) return;

    try {
      await navigator.share({
        title: link.title,
        text: `Pay for your order securely using TrustLink: ${link.url}`,
        url: link.url,
      });
      await track("link_shared", { platform: "native", method: "escrow_card" });
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Share failed:", err);
      }
    }
  };

  const handleCopy = async () => {
    if (isCopying) return;

    try {
      setIsCopying(true);
      setErrorMsg(null);

      if (!navigator.clipboard || !navigator.clipboard.writeText) {
        throw new Error("Clipboard not supported");
      }

      await navigator.clipboard.writeText(link.url);
      setCopyStatus("success");
      onCopySuccess?.();
      track("link_copied", { method: "copy_button" });
      setTimeout(() => setCopyStatus("idle"), 2000);
    } catch (err: unknown) {
      setCopyStatus("error");
      const msg = err instanceof Error ? err.message : "Failed to copy";
      setErrorMsg(msg);
      onCopyError?.(err instanceof Error ? err : new Error(String(err)));
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
    const text = `Pay for your order securely using TrustLink: ${link.url}`;

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
        // User cancelled or share failed, fall through to custom scheme
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    }

    // Fallback: Open WhatsApp app using URL scheme
    const waUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
    await track("link_shared", {
      platform: "whatsapp",
      method: "whatsapp_app",
    });
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
        <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-100">
          {link.title}
        </h2>
        <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
          {link.status}
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Amount</p>
          <p className="mt-1 text-base font-medium text-zinc-900 dark:text-zinc-100">
            {formatUSDC(link.amount)}
          </p>
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
          {canShare ? (
            <Button
              variant="outline"
              size="icon"
              onClick={handleNativeShare}
              aria-label="Native Share"
              title="Share via native share sheet"
              className="hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          ) : (
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
          )}
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
