"use client";

import {
  Copy,
  Download,
  Image as ImageIcon,
  MessageCircle,
  Share2,
  X,
} from "lucide-react";
import type { RefObject } from "react";
import { useId, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";
import { downloadQrCode } from "@/lib/utils/downloadQrCode";

/**
 * True when the user dismissed the native share sheet. Checked by name rather than
 * `instanceof Error`: a browser DOMException is not an `Error` in every realm
 * (jsdom, for one), and cancelling must never fall through to a fallback share.
 */
function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "AbortError"
  );
}

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
  qrRef: RefObject<HTMLDivElement | null>;
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
  qrRef,
}: EscrowLinkShareButtonsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const copyErrorId = useId();
  const [failedCopy, setFailedCopy] = useState<{
    platform: "instagram" | "twitter";
    text: string;
  } | null>(null);
  const canShare = typeof navigator !== "undefined" && Boolean(navigator.share);

  const copySocialText = async (
    text: string,
    platform: "instagram" | "twitter"
  ): Promise<boolean> => {
    try {
      await copyToClipboard(text);
    } catch {
      setFailedCopy({ platform, text });
      toast.error("Couldn't copy share text. Select and copy it below.");
      return false;
    }

    setFailedCopy(null);
    return true;
  };

  const shareWhatsApp = async () => {
    const text = `Pay for your order securely using TrustLink: ${url}`;
    await track("link_share_attempt", { platform: "whatsapp" });

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        await track("link_shared", { platform: "whatsapp", method: "native" });
        return;
      } catch (err) {
        if (isAbortError(err)) return;
        console.error("Share failed:", err);
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
        if (isAbortError(err)) return;
        console.error("Share failed:", err);
      }
    }

    if (!(await copySocialText(igText, "instagram"))) return;
    await track("link_shared", { platform: "instagram", method: "clipboard" });
    toast.success("Instagram share text copied!");
  };

  const copyTwitter = async () => {
    const xUrl = new URL(url);
    xUrl.searchParams.set("utm_source", "twitter");
    xUrl.searchParams.set("utm_medium", "share");
    const text = `Pay securely via TrustLink escrow: ${title} (${amount}) ${xUrl}`;
    if (!(await copySocialText(text, "twitter"))) return;
    await track("link_copied", { platform: "twitter" });
    toast.success("Tweet text copied!");
  };

  const downloadQR = async () => {
    try {
      await downloadQrCode(qrRef.current?.querySelector("svg"), `escrow_${escrowId}.png`);
    } catch {
      toast.error("Could not download QR code. Please try again.");
      return;
    }
    toast.success("QR code downloaded");
    void track("qr_code_downloaded", { escrowId });
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

      {failedCopy && (
        <div className="space-y-2">
          <p id={copyErrorId} role="alert" className="text-sm text-red-600 dark:text-red-400">
            Couldn&apos;t copy {failedCopy.platform === "twitter" ? "Twitter/X" : "Instagram"} share text.
            Select and copy the text below, or try the share button again.
          </p>
          <textarea
            aria-label="Share text to copy manually"
            aria-describedby={copyErrorId}
            readOnly
            value={failedCopy.text}
            rows={4}
            onFocus={(event) => event.currentTarget.select()}
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      )}

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
    </div>
  );
}
