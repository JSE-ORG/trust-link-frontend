"use client";

import {
  Copy,
  Download,
  Image as ImageIcon,
  MessageCircle,
  Share2,
  X,
} from "lucide-react";
import { useRef } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

async function copyToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    throw new Error("Clipboard not supported");
  }
  await navigator.clipboard.writeText(text);
}

interface EscrowLinkShareButtonsProps {
  url: string;
  title: string;
  amount: number;
  escrowId: string;
  isCopying: boolean;
  copyStatus: "idle" | "success" | "error";
  errorMsg: string | null;
  onCopy: () => void;
  onNativeShare: () => void;
}

export default function EscrowLinkShareButtons({
  url,
  title,
  amount,
  escrowId,
  isCopying,
  copyStatus,
  errorMsg,
  onCopy,
  onNativeShare,
}: EscrowLinkShareButtonsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canShare = typeof navigator !== "undefined" && Boolean(navigator.share);

  const shareWhatsApp = async () => {
    const text = `Pay for your order securely using TrustLink: ${url}`;
    await track("link_share_attempt", { platform: "whatsapp" });

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        await track("link_shared", { platform: "whatsapp", method: "native" });
        return;
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    }

    const waUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
    await track("link_shared", { platform: "whatsapp", method: "whatsapp_app" });
    toast.success("Opening WhatsApp...");
  };

  const shareInstagram = async () => {
    const igText = `Secure payment link via TrustLink: ${url}\n\nCopy and paste in your bio or story!`;
    await track("link_share_attempt", { platform: "instagram" });

    if (navigator.share) {
      try {
        await navigator.share({ title, text: igText, url });
        await track("link_shared", { platform: "instagram", method: "native" });
        return;
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    }

    await copyToClipboard(igText);
    await track("link_shared", { platform: "instagram", method: "clipboard" });
    toast.success("Instagram share text copied!");
  };

  const copyTwitter = async () => {
    const xUrl = `${url}?utm_source=twitter&utm_medium=share`;
    const text = `Pay securely via TrustLink escrow: ${title} (${amount}) ${xUrl}`;
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
    a.download = `escrow_${escrowId}.png`;
    a.click();
    await track("qr_code_downloaded", { escrowId });
    toast.success("QR code downloaded");
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          readOnly
          value={url}
          data-testid="escrow-link"
          className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <span className="sr-only">{url}</span>
      </div>

      <div className="flex gap-2">
        {canShare ? (
          <Button
            variant="outline"
            size="icon"
            onClick={onNativeShare}
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
            onClick={onCopy}
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

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
