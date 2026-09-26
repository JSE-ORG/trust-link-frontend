"use client";

import { useCallback, useEffect, useState } from "react";

import FetchErrorState, {
  getFetchErrorMessage,
} from "@/components/ui/FetchErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { track } from "@/lib/analytics";

import EscrowLinkDetails from "./EscrowLinkDetails";
import EscrowLinkHeader from "./EscrowLinkHeader";
import EscrowLinkQRCode from "./EscrowLinkQRCode";
import EscrowLinkShareButtons from "./EscrowLinkShareButtons";

async function fetchEscrowLink() {
  await new Promise((resolve) => setTimeout(resolve, 150));
  return {
    title: "Escrow Agreement 1293",
    status: "Active",
    amount: 12450,
    expires: "May 31, 2026",
    escrowId: "1293",
    url: "https://trustlink.example.com/pay/1293",
    imageUrl: undefined,
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
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">(
    "idle"
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <EscrowLinkHeader
        title={link.title}
        status={link.status}
        imageUrl={link.imageUrl}
      />
      <EscrowLinkDetails amount={link.amount} escrowId={link.escrowId} />
      <EscrowLinkShareButtons
        url={link.url}
        title={link.title}
        amount={link.amount}
        escrowId={link.escrowId}
        isCopying={isCopying}
        copyStatus={copyStatus}
        errorMsg={errorMsg}
        onCopy={handleCopy}
        onNativeShare={handleNativeShare}
      />
      <EscrowLinkQRCode url={link.url} />
    </div>
  );
}
