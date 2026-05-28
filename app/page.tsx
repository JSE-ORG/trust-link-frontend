"use client";

import { useState } from "react";
import TrackingTimeline, {
  type ShipmentStage,
  type TrackingStage,
} from "@/components/escrow/TrackingTimeline";

const DEMO_STAGES: TrackingStage[] = [
  {
    id: "ORDER_PLACED",
    label: "Order Placed",
    description: "Escrow funded & order confirmed",
    timestamp: "2025-05-24T09:15:00Z",
  },
  {
    id: "PICKED_UP",
    label: "Picked Up",
    description: "Vendor handed over to courier",
    timestamp: "2025-05-24T14:30:00Z",
  },
  {
    id: "IN_TRANSIT",
    label: "In Transit",
    description: "Shipment en route to destination",
    timestamp: "2025-05-25T08:00:00Z",
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

export default function Home() {
  const [currentStage, setCurrentStage] = useState<ShipmentStage>("IN_TRANSIT");

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--muted-bg)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "32px 16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 480,
          background: "var(--background)",
          borderRadius: 16,
          border: "1px solid var(--border)",
          boxShadow: "0 4px 24px rgba(27,42,107,0.07)",
          padding: "28px 24px 32px",
        }}
      >
        <header style={{ marginBottom: 24 }}>
          <p
            style={{
              margin: "0 0 4px",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--muted)",
            }}
          >
            Order #TL-20250524-88F2
          </p>
          <h1
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: "var(--primary)",
              lineHeight: 1.3,
            }}
          >
            Shipment Tracker
          </h1>
        </header>

        <TrackingTimeline
          currentStage={currentStage}
          stages={DEMO_STAGES}
        />

        <div
          style={{
            marginTop: 32,
            paddingTop: 20,
            borderTop: "1px solid var(--border)",
          }}
        >
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--muted)",
            }}
          >
            Demo: advance stage
          </p>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            {STAGE_ORDER.map((stage) => (
              <button
                key={stage}
                onClick={() => setCurrentStage(stage)}
                aria-pressed={currentStage === stage}
                style={{
                  fontSize: 12,
                  fontWeight: 500,
                  padding: "5px 12px",
                  borderRadius: 20,
                  border: "1.5px solid",
                  cursor: "pointer",
                  transition: "background 0.2s, color 0.2s, border-color 0.2s",
                  borderColor:
                    currentStage === stage ? "var(--accent)" : "var(--border)",
                  background:
                    currentStage === stage
                      ? "color-mix(in srgb, var(--accent) 10%, transparent)"
                      : "transparent",
                  color:
                    currentStage === stage ? "var(--accent)" : "var(--muted)",
                }}
              >
                {stage.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
