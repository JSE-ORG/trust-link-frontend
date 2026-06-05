"use client";

import { formatTimeAgo } from "@/lib/utils";
import { useTranslation } from "react-i18next";

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
  const baseStyle: React.CSSProperties = {
    width: 44,
    height: 44,
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    position: "relative",
    transition: "background 0.3s, border-color 0.3s",
  };

  const completedStyle: React.CSSProperties = {
    ...baseStyle,
    background: "var(--success)",
    border: "2px solid var(--success)",
    color: "#fff",
  };

  const currentStyle: React.CSSProperties = {
    ...baseStyle,
    background: "#fff",
    border: "2.5px solid var(--warning)",
    color: "var(--warning)",
    animation: "timeline-pulse 1.8s ease-in-out infinite",
  };

  const upcomingStyle: React.CSSProperties = {
    ...baseStyle,
    background: "var(--muted-bg)",
    border: "2px solid var(--border)",
    color: "var(--muted)",
  };

  const iconStyle: React.CSSProperties = { width: 20, height: 20 };

  const resolvedStyle =
    status === "completed" ? completedStyle : status === "current" ? currentStyle : upcomingStyle;

  return (
    <span style={resolvedStyle}>
      <span style={iconStyle}>
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
      className={className}
      style={{ fontFamily: "var(--font-geist-sans, Arial, sans-serif)" }}
      aria-label="Shipment tracking timeline"
    >
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
          border: 0,
        }}
      >
        {liveMessage}
      </div>

      <ol
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: 0,
        }}
      >
        {stages.map((stage, index) => {
          const status = getStageStatus(stage.id, currentStage);
          const isLast = index === stages.length - 1;

          return (
            <li
              key={stage.id}
              style={{
                display: "flex",
                flexDirection: "row",
                gap: 0,
                alignItems: "stretch",
              }}
              aria-current={status === "current" ? "step" : undefined}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: 44,
                  flexShrink: 0,
                }}
              >
                <StageIcon stageId={stage.id} status={status} />
                {!isLast && (
                  <div
                    aria-hidden="true"
                    style={{
                      width: 2,
                      flex: 1,
                      minHeight: 24,
                      background:
                        index < currentIndex
                          ? "var(--success)"
                          : "var(--border)",
                      transition: "background 0.3s",
                      marginTop: 2,
                      marginBottom: 2,
                    }}
                  />
                )}
              </div>

              <div
                style={{
                  paddingLeft: 16,
                  paddingTop: 8,
                  paddingBottom: isLast ? 0 : 24,
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontWeight: 600,
                    fontSize: 15,
                    lineHeight: "1.4",
                    color:
                      status === "upcoming"
                        ? "var(--muted)"
                        : status === "current"
                        ? "var(--warning)"
                        : "var(--success)",
                    transition: "color 0.3s",
                  }}
                >
                  {stage.label}
                  {status === "current" && (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 11,
                        fontWeight: 500,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "var(--warning)",
                        background: "color-mix(in srgb, var(--warning) 12%, transparent)",
                        border: "1px solid color-mix(in srgb, var(--warning) 30%, transparent)",
                        borderRadius: 4,
                        padding: "1px 6px",
                        verticalAlign: "middle",
                      }}
                    >
                      Active
                    </span>
                  )}
                </p>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: 13,
                    lineHeight: "1.5",
                    color: "var(--muted)",
                  }}
                >
                  {stage.description}
                </p>
                {stage.timestamp && (
                  <time
                    dateTime={stage.timestamp}
                    style={{
                      display: "block",
                      marginTop: 4,
                      fontSize: 12,
                      color: status === "upcoming" ? "var(--border)" : "var(--muted)",
                      fontVariantNumeric: "tabular-nums",
                    }}
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
