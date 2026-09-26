"use client";

import { useTranslation } from "react-i18next";

import { formatTimeAgo } from "@/lib/utils";

export type ShipmentStage =
  | "ORDER_PLACED"
  | "PICKED_UP"
  | "IN_TRANSIT"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";

export interface TrackingStage {
  id: ShipmentStage;
  label: string;
  description: string;
  timestamp?: string;
}

export interface TrackingTimelineProps {
  currentStage: ShipmentStage;
  stages?: TrackingStage[];
  className?: string;
}

const DEFAULT_STAGES: TrackingStage[] = [
  {
    id: "ORDER_PLACED",
    label: "Order Placed",
    description: "Escrow funded & order confirmed",
  },
  {
    id: "PICKED_UP",
    label: "Picked Up",
    description: "Vendor handed over to courier",
  },
  {
    id: "IN_TRANSIT",
    label: "In Transit",
    description: "Shipment en route to destination",
  },
  {
    id: "OUT_FOR_DELIVERY",
    label: "Out for Delivery",
    description: "Package is nearby",
  },
  {
    id: "DELIVERED",
    label: "Delivered",
    description: "Item received — awaiting confirmation",
  },
];

const STAGE_ORDER: ShipmentStage[] = [
  "ORDER_PLACED",
  "PICKED_UP",
  "IN_TRANSIT",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
];

const CHECKMARK_ICON = (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth={3} 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    aria-hidden="true"
    data-testid="checkmark-icon"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const STAGE_ICONS: Record<ShipmentStage, React.ReactNode> = {
  ORDER_PLACED: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 12l2 2 4-4" />
      <rect x="3" y="3" width="18" height="18" rx="2" />
    </svg>
  ),
  PICKED_UP: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 7H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2Z" />
      <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
    </svg>
  ),
  IN_TRANSIT: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <path d="M16 8h4l3 3v5h-7V8Z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  OUT_FOR_DELIVERY: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7Z" />
      <circle cx="12" cy="9" r="2.5" />
    </svg>
  ),
  DELIVERED: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <path d="M22 4 12 14.01l-3-3" />
    </svg>
  ),
};

type StageStatus = "completed" | "current" | "upcoming";

function getStageStatus(stageId: ShipmentStage, currentStage: ShipmentStage): StageStatus {
  const stageIndex = STAGE_ORDER.indexOf(stageId);
  const currentIndex = STAGE_ORDER.indexOf(currentStage);
  if (stageIndex < currentIndex) return "completed";
  if (stageIndex === currentIndex) return "current";
  return "upcoming";
}

function StageIcon({ stageId, status }: { stageId: ShipmentStage; status: StageStatus }) {
  const baseClasses =
    "w-[44px] h-[44px] rounded-full flex items-center justify-center shrink-0 relative transition-colors duration-300 [&>span]:w-5 [&>span]:h-5 [&>span>svg]:w-5 [&>span>svg]:h-5";

  const statusClasses =
    status === "completed"
      ? "bg-[var(--success)] border-2 border-[var(--success)] text-white"
      : status === "current"
      ? "bg-white border-[2.5px] border-[var(--warning)] text-[var(--warning)] animate-[timeline-pulse_1.8s_ease-in-out_infinite]"
      : "bg-[var(--muted-bg)] border-2 border-[var(--border)] text-[var(--muted)]";

  return (
    <span className={`${baseClasses} ${statusClasses}`}>
      <span>
        {status === "completed" ? CHECKMARK_ICON : STAGE_ICONS[stageId]}
      </span>
    </span>
  );
}

export default function TrackingTimeline({
  currentStage,
  stages = DEFAULT_STAGES,
  className = "",
}: TrackingTimelineProps) {
  const { i18n } = useTranslation();
  const currentIndex = STAGE_ORDER.indexOf(currentStage);

  const liveMessage = (() => {
    const stage = stages.find((s) => s.id === currentStage);
    return stage ? `Current shipment status: ${stage.label}. ${stage.description}.` : "";
  })();

  return (
    <section
      className={`font-[family-name:var(--font-geist-sans,Arial,sans-serif)] ${className}`}
      aria-label="Shipment tracking timeline"
    >
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {liveMessage}
      </div>

      <ol className="list-none m-0 p-0 flex flex-col gap-0">
        {stages.map((stage, index) => {
          const status = getStageStatus(stage.id, currentStage);
          const isLast = index === stages.length - 1;

          return (
            <li
              key={stage.id}
              className="flex flex-row gap-0 items-stretch"
              aria-current={status === "current" ? "step" : undefined}
            >
              <div className="flex flex-col items-center w-[44px] shrink-0">
                <StageIcon stageId={stage.id} status={status} />
                {!isLast && (
                  <div
                    aria-hidden="true"
                    className={`w-[2px] flex-1 min-h-[24px] my-[2px] transition-colors duration-300 ${
                      index < currentIndex
                        ? "bg-[var(--success)]"
                        : "bg-[var(--border)]"
                    }`}
                  />
                )}
              </div>

              <div
                className={`pl-4 pt-2 flex-1 min-w-0 ${
                  isLast ? "pb-0" : "pb-6"
                }`}
              >
                <p
                  className={`m-0 font-semibold text-[15px] leading-[1.4] transition-colors duration-300 ${
                    status === "upcoming"
                      ? "text-[var(--muted)]"
                      : status === "current"
                      ? "text-[var(--warning)]"
                      : "text-[var(--success)]"
                  }`}
                >
                  {stage.label}
                  {status === "current" && (
                    <span className="ml-2 text-[11px] font-medium tracking-[0.06em] uppercase text-[var(--warning)] bg-[color-mix(in_srgb,var(--warning)_12%,transparent)] border border-[color-mix(in_srgb,var(--warning)_30%,transparent)] rounded px-[6px] py-[1px] align-middle">
                      Active
                    </span>
                  )}
                </p>
                <p className="m-0 mt-0.5 text-[13px] leading-[1.5] text-[var(--muted)]">
                  {stage.description}
                </p>
                {stage.timestamp && (
                  <time
                    dateTime={stage.timestamp}
                    className={`block mt-1 text-xs tabular-nums ${
                      status === "upcoming" ? "text-[var(--border)]" : "text-[var(--muted)]"
                    }`}
                  >
                    {formatTimeAgo(stage.timestamp, i18n.language)}
                  </time>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
