"use client";

import { AlertCircle, Calendar, CheckCircle, DollarSign, ExternalLink, Package, User,XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import useWallet from "@/hooks/useWallet";
import { resolveDispute } from "@/lib/api";
import { formatTimeAgo } from "@/lib/utils";
import { Dispute, EscrowStatus } from "@/types";
import { formatUSDC } from "@/utils/currency";

interface DisputeDetailsClientProps {
  dispute: Dispute;
}

type Resolution = 'RELEASE_TO_VENDOR' | 'REFUND_BUYER';

/** Escrow state each resolution settles the funds into, used for the optimistic badge. */
const RESOLVED_ESCROW_STATUS: Record<Resolution, EscrowStatus> = {
  RELEASE_TO_VENDOR: 'RELEASED',
  REFUND_BUYER: 'REFUNDED',
};

const DISPUTE_STATUS_STYLES: Record<Dispute['status'], string> = {
  OPEN: 'bg-amber-100 text-amber-700',
  UNDER_REVIEW: 'bg-blue-100 text-blue-700',
  RESOLVED: 'bg-emerald-100 text-emerald-700',
};

export function DisputeDetailsClient({ dispute }: DisputeDetailsClientProps) {
  const router = useRouter();
  const { i18n } = useTranslation();
  const { token } = useWallet();
  const [isResolving, setIsResolving] = useState(false);
  const [showConfirm, setShowConfirm] = useState<Resolution | null>(null);
  // Locally tracked copies of the server state so the badges can be updated
  // optimistically and rolled back if the resolve request fails.
  const [disputeStatus, setDisputeStatus] = useState<Dispute['status']>(dispute.status);
  const [escrowStatus, setEscrowStatus] = useState<EscrowStatus>(dispute.escrow.status);

  const handleResolve = async (resolution: Resolution) => {
    const previousDisputeStatus = disputeStatus;
    const previousEscrowStatus = escrowStatus;

    // Optimistic update: reflect the resolution and dismiss the dialog straight
    // away so the action feels instantaneous instead of stalling on the network
    // round-trip. The request is still awaited below to confirm or undo it.
    setDisputeStatus('RESOLVED');
    setEscrowStatus(RESOLVED_ESCROW_STATUS[resolution]);
    setShowConfirm(null);
    setIsResolving(true);

    try {
      await resolveDispute(dispute.id, resolution, token || undefined);
      router.push("/admin/disputes");
      router.refresh();
    } catch (error) {
      // Roll back to the last server-confirmed state and surface the failure,
      // so the admin never sees a resolution that did not actually happen.
      setDisputeStatus(previousDisputeStatus);
      setEscrowStatus(previousEscrowStatus);
      toast.error(error instanceof Error ? error.message : "Failed to resolve dispute. Please try again.");
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column: Escrow & Dispute Info */}
      <div className="lg:col-span-2 space-y-8">
        {/* Escrow Summary */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              Escrow Summary
            </h2>
            <span
              data-testid="escrow-status-badge"
              aria-live="polite"
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                escrowStatus === 'DISPUTED' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
              }`}
            >
              {escrowStatus}
            </span>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-zinc-400 mt-1" />
              <div>
                <p className="text-sm text-zinc-500">Item</p>
                <p className="font-medium">{dispute.escrow.item}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="w-5 h-5 text-zinc-400 mt-1" />
              <div>
                <p className="text-sm text-zinc-500">Amount</p>
                <p className="font-medium">{formatUSDC(dispute.escrow.amount)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-zinc-400 mt-1" />
              <div>
                <p className="text-sm text-zinc-500">Vendor ID</p>
                <p className="font-mono text-xs break-all">{dispute.escrow.vendorId}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 text-zinc-400 mt-1" />
              <div>
                <p className="text-sm text-zinc-500">Buyer ID</p>
                <p className="font-mono text-xs break-all">{dispute.buyerId}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Dispute Evidence */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-destructive" />
              Dispute Evidence
            </h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <p className="text-sm text-zinc-500 mb-1">Reason for Dispute</p>
              <p className="p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                {dispute.reason}
              </p>
            </div>
            <div>
              <p className="text-sm text-zinc-500 mb-3">Supporting Evidence</p>
              {dispute.evidence.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {dispute.evidence.map((link, index) => (
                    <a
                      key={index}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative aspect-square bg-zinc-100 dark:bg-zinc-800 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 transition-colors flex items-center justify-center"
                    >
                      <div className="text-center">
                        <ExternalLink className="w-6 h-6 mx-auto text-zinc-400 group-hover:text-blue-500 transition-colors" />
                        <span className="text-[10px] text-zinc-500 mt-1">View Attachment {index + 1}</span>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-zinc-400 italic">No evidence provided.</p>
              )}
            </div>
          </div>
        </section>

        {/* Escrow History */}
        <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="w-5 h-5 text-zinc-500" />
              Escrow History
            </h2>
          </div>
          <div className="p-6">
            <div className="relative border-l-2 border-zinc-100 dark:border-zinc-800 ml-3 space-y-8">
              {dispute.escrow.history.map((event) => (
                <div key={event.id} className="relative pl-8">
                  <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-700" />
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <p className="font-medium text-sm">{event.description}</p>
                    <time className="text-xs text-zinc-500 whitespace-nowrap">{formatTimeAgo(event.timestamp, i18n.language)}</time>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">Status changed to {event.status}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Right Column: Actions */}
      <div className="space-y-6">
        <section className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 sticky top-8">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold">Resolution Actions</h3>
            <span
              data-testid="dispute-status-badge"
              aria-live="polite"
              className={`px-3 py-1 rounded-full text-xs font-medium ${DISPUTE_STATUS_STYLES[disputeStatus]}`}
            >
              {disputeStatus}
            </span>
          </div>

          <div className="space-y-4">
            <button
              onClick={() => setShowConfirm('RELEASE_TO_VENDOR')}
              disabled={isResolving || disputeStatus === 'RESOLVED'}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Release to Vendor
            </button>
            <button
              onClick={() => setShowConfirm('REFUND_BUYER')}
              disabled={isResolving || disputeStatus === 'RESOLVED'}
              className="w-full py-3 px-4 bg-white hover:bg-zinc-50 border border-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed text-zinc-900 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <XCircle className="w-5 h-5 text-destructive" />
              Refund Buyer
            </button>
          </div>

          {/* The badge above already reads RESOLVED; this keeps the admin aware
              that the change is still being confirmed on the backend. */}
          {isResolving ? (
            <p className="mt-4 text-xs text-zinc-500" role="status">
              Confirming resolution&hellip;
            </p>
          ) : null}

          <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-zinc-800">
            <div className="flex items-center gap-2 text-sm text-zinc-500">
              <AlertCircle className="w-4 h-4" />
              <p>Resolution is final and cannot be undone.</p>
            </div>
          </div>
        </section>
      </div>

      {/* Confirmation Dialog */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 max-w-md w-full shadow-2xl">
            <h4 className="text-xl font-bold mb-4">
              {showConfirm === 'RELEASE_TO_VENDOR' ? 'Confirm Release' : 'Confirm Refund'}
            </h4>
            <p className="text-zinc-600 dark:text-zinc-400 mb-8">
              {showConfirm === 'RELEASE_TO_VENDOR' 
                ? 'Are you sure you want to release the funds to the vendor? This will close the dispute and complete the escrow.'
                : 'Are you sure you want to refund the buyer? This will return the funds to the buyer and cancel the escrow.'}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowConfirm(null)}
                className="flex-1 py-3 px-4 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 rounded-xl font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResolve(showConfirm)}
                disabled={isResolving}
                className={`flex-1 py-3 px-4 text-white rounded-xl font-medium transition-colors ${
                  showConfirm === 'RELEASE_TO_VENDOR' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-destructive hover:bg-destructive/90'
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
