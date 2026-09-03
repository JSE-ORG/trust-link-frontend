"use client";

import { Check, Copy, MessageCircle, Share2 } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import QRCodeComponent from "@/components/ui/QRCodeComponent";
import { track } from "@/lib/analytics";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  escrowId: string;
}

export default function ShareModal({ isOpen, onClose, url }: ShareModalProps) {
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canShare = typeof navigator !== "undefined" && navigator.share;

  useEffect(() => {
    return () => {
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
    };
  }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setCopyStatus("Link copied!");
      track("link_copied", { method: "share_modal" });
      if (copyTimeout.current) clearTimeout(copyTimeout.current);
      copyTimeout.current = setTimeout(() => {
        setCopied(false);
        setCopyStatus(null);
      }, 2000);
    } catch {
      setCopied(false);
      setCopyStatus("Failed to copy");
    }
  };

  const handleNativeShare = async () => {
    if (!navigator.share) return;
    
    try {
      await navigator.share({
        title: "TrustLink Payment",
        text: `Pay for your order securely using TrustLink`,
        url: url,
      });
      track("link_shared", { platform: "native", method: "share_modal" });
    } catch (err) {
      // User cancelled or share failed
      if ((err as Error).name !== "AbortError") {
        console.error("Share failed:", err);
      }
    }
  };

  const shareWhatsApp = async () => {
    const text = `Pay for your order securely using TrustLink: ${url}`;
    
    // Try native share first on mobile
    if (navigator.share) {
      try {
        await navigator.share({
          title: "TrustLink Payment",
          text: text,
          url: url,
        });
        track("link_shared", { platform: "whatsapp", method: "native" });
        return;
      } catch (err) {
        // User cancelled or share failed, fall through to WhatsApp URL
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
        }
      }
    }
    
    // Fallback: Open WhatsApp app using URL scheme
    const waUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, "_blank");
    track("link_shared", { platform: "whatsapp", method: "share_modal" });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Escrow Link Generated!</DialogTitle>
          <DialogDescription>
            Share this link with your buyer so they can securely pay.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 flex flex-col items-center gap-6">
          <QRCodeComponent value={url} size={200} />

          <div className="w-full space-y-4">
            <div className="relative">
              <input
                readOnly
                value={url}
                className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-sm text-zinc-900 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
              />
            </div>
            
            {copyStatus && (
              <p
                role="status"
                aria-live="polite"
                className={`text-center text-sm font-medium ${
                  copied ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {copyStatus}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              {canShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-2 rounded-full bg-black px-4 py-2.5 font-medium text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
                >
                  <Share2 className="h-4 w-4" />
                  Share
                </button>
              )}
              <button
                type="button"
                onClick={handleCopy}
                aria-label={copied ? "Link copied to clipboard" : "Copy link to clipboard"}
                className={`flex items-center justify-center gap-2 rounded-full border px-4 py-2.5 font-medium transition ${
                  copied
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                    : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-white dark:hover:bg-zinc-900"
                }`}
              >
                <span className="relative flex h-4 w-4 items-center justify-center">
                  <Copy
                    className={`absolute h-4 w-4 transition-all duration-200 ${
                      copied ? "scale-0 opacity-0" : "scale-100 opacity-100"
                    }`}
                  />
                  <Check
                    className={`absolute h-4 w-4 transition-all duration-200 ${
                      copied ? "scale-100 opacity-100" : "scale-0 opacity-0"
                    }`}
                  />
                </span>
                {copied ? "Copied!" : "Copy Link"}
              </button>
              <button
                type="button"
                onClick={shareWhatsApp}
                className="flex items-center justify-center gap-2 rounded-full bg-green-500 px-4 py-2.5 font-medium text-white transition hover:bg-green-600"
              >
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
