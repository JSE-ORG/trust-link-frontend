"use client";

import { CheckCircle2, Circle, Clock, Package } from "lucide-react";
import { startTransition, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { ConfirmDeliveryButton } from "@/components/escrow/ConfirmDeliveryButton";
import TrackingSection from "@/components/tracking/TrackingSection";
import TrackingTimelineSkeleton from "@/components/tracking/TrackingTimelineSkeleton";
import FetchErrorState, { getFetchErrorMessage } from "@/components/ui/FetchErrorState";
import { useEscrow } from "@/hooks/useEscrow";
import { track } from "@/lib/analytics";
import { UNAVAILABLE_DATE } from "@/lib/utils";
import { Escrow, EscrowStatus, EscrowStatusConst } from "@/types";

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
    statuses: [EscrowStatusConst.PENDING, EscrowStatusConst.FUNDED, EscrowStatusConst.SHIPPED, EscrowStatusConst.COMPLETED, EscrowStatusConst.RELEASED],
  },
  {
    id: "confirmed",
    titleKey: "tracking.paymentConfirmed",
    descriptionKey: "tracking.paymentConfirmedDesc",
    icon: CheckCircle2,
    statuses: [EscrowStatusConst.FUNDED, EscrowStatusConst.SHIPPED, EscrowStatusConst.COMPLETED, EscrowStatusConst.RELEASED],
  },
  {
    id: "shipped",
    titleKey: "tracking.shipped",
    descriptionKey: "tracking.shippedDesc",
    icon: Package,
    statuses: [EscrowStatusConst.SHIPPED, EscrowStatusConst.COMPLETED, EscrowStatusConst.RELEASED],
  },
  {
    id: "settled",
    titleKey: "tracking.escrowCompleted",
    descriptionKey: "tracking.escrowCompletedDesc",
    icon: CheckCircle2,
    statuses: [EscrowStatusConst.COMPLETED, EscrowStatusConst.RELEASED],
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
  const { data: escrow, isLoading, error: fetchError, refetch } = useEscrow(escrowId, {
    initialData: initialEscrow,
    refreshInterval: 30000,
  });

  const [localError, setLocalError] = useState<Error | null>(null);

  // Touch Swipe State — must be before early returns (hooks order rule)
  const [swipeIndex, setSwipeIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const activeEscrow = escrow || initialEscrow;

  const getCurrentStageIndex = (status: EscrowStatus): number => {
    if (status === EscrowStatusConst.COMPLETED || status === EscrowStatusConst.RELEASED) return 3;
    if (status === EscrowStatusConst.SHIPPED) return 2;
    if (status === EscrowStatusConst.FUNDED) return 1;
    if (status === EscrowStatusConst.PENDING) return 0;
    return 0;
  };

  // Historical escrow records retain confirmed progress during a dispute or refund.
  const currentStageIndex = Math.max(
    getCurrentStageIndex(activeEscrow.status),
    ...activeEscrow.history.map((event) => getCurrentStageIndex(event.status)),
  );
  const isShipped = activeEscrow?.status === EscrowStatusConst.SHIPPED;

  // Sync swipe index with the actual stage index when it changes
  useEffect(() => {
    startTransition(() => setSwipeIndex(currentStageIndex));
  }, [currentStageIndex]);

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncBreakpoint = () => setIsMobile(mediaQuery.matches);
    syncBreakpoint();
    mediaQuery.addEventListener?.("change", syncBreakpoint);
    return () => mediaQuery.removeEventListener?.("change", syncBreakpoint);
  }, []);

  const handleRaiseDispute = () => {
    window.location.href = `/dispute/${escrowId}`;
  };

  if (fetchError || localError) {
    const activeError = fetchError || localError;
    return (
      <FetchErrorState
        title={t("tracking.loadErrorTitle")}
        message={getFetchErrorMessage(activeError, t("tracking.loadError"))}
        onRetry={() => {
          setLocalError(null);
          void refetch();
        }}
      />
    );
  }

  if (loading || (!escrow && isLoading)) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <TrackingTimelineSkeleton />
      </div>
    );
  }

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && swipeIndex < TRACKING_STAGES.length - 1) {
      setSwipeIndex((prev) => prev + 1);
    }
    if (isRightSwipe && swipeIndex > 0) {
      setSwipeIndex((prev) => prev - 1);
    }
  };

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-6 text-lg font-semibold text-zinc-950 dark:text-zinc-100">
          {t("tracking.escrowMilestones")}
        </h2>
        
        <div 
          className="relative overflow-hidden touch-pan-y"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <ol 
            role="list"
            aria-label={t("tracking.escrowMilestones")}
            className={`flex transition-transform duration-300 ease-out md:block md:space-y-6 md:!transform-none ${
              ["translate-x-0", "-translate-x-full", "-translate-x-[200%]", "-translate-x-[300%]"][swipeIndex] ??
              "translate-x-0"
            }`}
          >
            {TRACKING_STAGES.map((stage, index) => {
              const isCompleted = index < currentStageIndex;
              const isCurrent = index === currentStageIndex;
              const isPending = index > currentStageIndex;
              const Icon = stage.icon;
              const isSlideVisible = !isMobile || index === swipeIndex;

              return (
                <li
                  key={stage.id}
                  role="listitem"
                  tabIndex={isSlideVisible ? 0 : -1}
                  aria-current={isCurrent ? "step" : undefined}
                  aria-hidden={!isSlideVisible}
                  className="w-full flex-shrink-0 list-none rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 md:w-auto md:flex-shrink"
                >
                  <div className="flex items-start gap-4">
                    <span className="sr-only">
                      {index + 1} of {TRACKING_STAGES.length}
                    </span>
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
                      {isCurrent && activeEscrow.updatedAt && (() => {
                        const updatedAt = new Date(activeEscrow.updatedAt);
                        const timestamp = Number.isNaN(updatedAt.getTime())
                          ? UNAVAILABLE_DATE
                          : new Intl.DateTimeFormat(i18n.language, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(updatedAt);
                        return (
                          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
                            {timestamp}
                          </p>
                        );
                      })()}
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
                </li>
              );
            })}
          </ol>

          {/* Mobile swipe indicators */}
          <div
            role="tablist"
            aria-label={t("tracking.escrowMilestones")}
            className="mt-6 flex items-center justify-center gap-1 md:hidden"
          >
            {TRACKING_STAGES.map((stage, index) => {
              const isSelected = index === swipeIndex;
              return (
                <button
                  key={index}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSwipeIndex(index)}
                  className="flex h-11 w-11 items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                  aria-label={`${t("tracking.goToStage", { stage: index + 1 })}: ${t(stage.titleKey)} (${index + 1} of ${TRACKING_STAGES.length})`}
                >
                  <span
                    className={`block rounded-full transition-all duration-200 ${
                      isSelected
                        ? "h-2.5 w-6 bg-blue-600 dark:bg-blue-400"
                        : "h-2.5 w-2.5 bg-zinc-300 dark:bg-zinc-700 hover:bg-zinc-400"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <TrackingSection escrowId={escrowId} />

      {/* Action Buttons */}
      {isShipped && (
        <div className="flex flex-col gap-3 sm:flex-row">
          <ConfirmDeliveryButton
            escrowId={escrowId}
            onSuccess={() => {
              setLocalError(null);
              refetch();
              track("delivery_confirmed", { escrowId });
            }}
          />
          <button
            onClick={handleRaiseDispute}
            className="flex-1 rounded-2xl border-2 border-red-600 bg-transparent px-6 py-3 font-semibold text-red-600 transition-colors hover:bg-red-50 dark:border-red-500 dark:text-red-500 dark:hover:bg-red-950"
          >
            {t("tracking.raiseDispute")}
          </button>
        </div>
      )}

      {/* Dispute Status */}
      {activeEscrow.status === EscrowStatusConst.DISPUTED && (
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
