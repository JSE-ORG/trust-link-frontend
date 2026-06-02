"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { Escrow, EscrowStatus } from "@/types";
import { CheckCircle2, Circle, Clock, Package, Truck, Home } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEscrow } from "@/hooks/useEscrow";
import { track } from "@/lib/analytics";

interface TrackingStage {
  id: string;
  titleKey: string;
  descriptionKey: string;
  icon: React.ComponentType<{ className?: string }>;
  statuses: EscrowStatus[];
}

const TRACKING_STAGES: TrackingStage[] = [
  {
    id: "placed",
    titleKey: "tracking.orderPlaced",
    descriptionKey: "tracking.orderPlacedDesc",
    icon: Clock,
    statuses: ["PENDING", "FUNDED", "SHIPPED", "COMPLETED", "RELEASED"],
  },
  {
    id: "confirmed",
    titleKey: "tracking.paymentConfirmed",
    descriptionKey: "tracking.paymentConfirmedDesc",
    icon: CheckCircle2,
    statuses: ["FUNDED", "SHIPPED", "COMPLETED", "RELEASED"],
  },
  {
    id: "shipped",
    titleKey: "tracking.shipped",
    descriptionKey: "tracking.shippedDesc",
    icon: Package,
    statuses: ["SHIPPED", "COMPLETED", "RELEASED"],
  },
  {
    id: "delivery",
    titleKey: "tracking.outForDelivery",
    descriptionKey: "tracking.outForDeliveryDesc",
    icon: Truck,
    statuses: ["SHIPPED", "COMPLETED", "RELEASED"],
  },
  {
    id: "delivered",
    titleKey: "tracking.delivered",
    descriptionKey: "tracking.deliveredDesc",
    icon: Home,
    statuses: ["COMPLETED", "RELEASED"],
  },
];

interface TrackingTimelineProps {
  escrowId: string;
  initialEscrow: Escrow;
  loading?: boolean;
}

export default function TrackingTimeline({
  escrowId,
  initialEscrow,
  loading = false,
}: TrackingTimelineProps) {
  const { t, i18n } = useTranslation();
  const { escrow, isLoading, error: fetchError, refetch } = useEscrow(escrowId, {
    initialData: initialEscrow,
    refreshInterval: 30000,
  });

  const [localError, setLocalError] = useState<Error | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!escrow) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        await refetch();
      } catch (err) {
        console.error("Failed to refresh escrow status:", err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [escrowId, refetch]);

  const handleConfirmDelivery = async () => {
    setIsConfirming(true);
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/escrows/${escrowId}/confirm`, {
        method: "POST",
      });
      if (!response.ok) throw new Error('Failed to confirm delivery');

      await refetch();
      track("delivery_confirmed", { escrowId });
    } catch (err) {
      setLocalError(err instanceof Error ? err : new Error("Failed to confirm delivery"));
    } finally {
      setIsConfirming(false);
    }
  };

  const handleRaiseDispute = () => {
    window.location.href = `/dispute/${escrowId}`;
  };

  if (fetchError || localError) throw fetchError || localError;

  if (loading || (!escrow && isLoading)) {
    return (
      <div className="space-y-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        {[...Array(5)].map((_, index) => (
          <div key={index} className="flex items-start gap-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-5 w-2/5" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Fallback to initialEscrow if escrow is still loading or null
  const activeEscrow = escrow || initialEscrow;

  const getCurrentStageIndex = (status: EscrowStatus): number => {
    if (status === "COMPLETED" || status === "RELEASED") return 4;
    if (status === "SHIPPED") return 2;
    if (status === "FUNDED") return 1;
    if (status === "PENDING") return 0;
    return 0;
  };

  const currentStageIndex = getCurrentStageIndex(activeEscrow.status);
  const isShipped = activeEscrow.status === "SHIPPED";
  const canConfirmDelivery = isShipped;
  const canRaiseDispute = isShipped;

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-6 text-lg font-semibold text-zinc-950 dark:text-zinc-100">
          {t("tracking.shipmentStatus")}
        </h2>
        <div className="space-y-6">
          {TRACKING_STAGES.map((stage, index) => {
            const isCompleted = index < currentStageIndex;
            const isCurrent = index === currentStageIndex;
            const isPending = index > currentStageIndex;
            const Icon = stage.icon;

            return (
              <div key={stage.id} className="flex items-start gap-4">
                {/* Icon */}
                <div
                  className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full ${
                    isCompleted
                      ? "bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"
                      : isCurrent
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"
                      : "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <p
                    className={`text-base font-semibold ${
                      isCompleted || isCurrent
                        ? "text-zinc-950 dark:text-zinc-100"
                        : "text-zinc-500 dark:text-zinc-500"
                    }`}
                  >
                    {t(stage.titleKey)}
                  </p>
                  <p
                    className={`mt-1 text-sm ${
                      isCompleted || isCurrent
                        ? "text-zinc-600 dark:text-zinc-400"
                        : "text-zinc-400 dark:text-zinc-600"
                    }`}
                  >
                    {t(stage.descriptionKey)}
                  </p>
                  {isCurrent && activeEscrow.updatedAt && (
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                      {new Intl.DateTimeFormat(i18n.language, {
                        dateStyle: "medium",
                        timeStyle: "short",
                      }).format(new Date(activeEscrow.updatedAt))}
                    </p>
                  )}
                </div>

                {/* Status indicator */}
                {isCompleted && (
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
                )}
                {isCurrent && (
                  <div className="h-5 w-5 flex-shrink-0">
                    <div className="h-full w-full animate-pulse rounded-full bg-blue-600 dark:bg-blue-400" />
                  </div>
                )}
                {isPending && (
                  <Circle className="h-5 w-5 flex-shrink-0 text-zinc-300 dark:text-zinc-700" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Action Buttons */}
      {(canConfirmDelivery || canRaiseDispute) && (
        <div className="flex flex-col gap-3 sm:flex-row">
          {canConfirmDelivery && (
            <button
              onClick={handleConfirmDelivery}
              disabled={isConfirming}
              className="flex-1 rounded-2xl bg-green-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-700 dark:hover:bg-green-800"
            >
              {isConfirming ? t("tracking.confirming") : t("tracking.confirmDelivery")}
            </button>
          )}
          {canRaiseDispute && (
            <button
              onClick={handleRaiseDispute}
              className="flex-1 rounded-2xl border-2 border-red-600 bg-transparent px-6 py-3 font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-950"
            >
              {t("tracking.raiseDispute")}
            </button>
          )}
        </div>
      )}

      {/* Dispute Status */}
      {activeEscrow.status === "DISPUTED" && (
        <div className="rounded-3xl border border-yellow-200 bg-yellow-50 p-6 dark:border-yellow-900 dark:bg-yellow-950">
          <h3 className="mb-2 text-lg font-semibold text-yellow-900 dark:text-yellow-100">
            {t("tracking.disputeInProgress")}
          </h3>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            {t("tracking.disputeMessage")}
          </p>
        </div>
      )}
    </div>
  );
}
