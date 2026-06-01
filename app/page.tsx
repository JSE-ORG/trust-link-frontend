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
    <div className="min-h-full bg-muted-bg flex items-start justify-center py-8 px-4">
      <div className="w-full max-w-lg bg-background rounded-2xl border border-border shadow-xl dark:shadow-none p-7 sm:p-6 sm:pb-8">
        <header className="mb-6">
          <p className="m-0 mb-1 text-[12px] font-semibold tracking-widest uppercase text-muted">
            Order #TL-20250524-88F2
          </p>
          <h1 className="m-0 text-xl font-bold text-primary dark:text-accent leading-tight">
            Shipment Tracker
          </h1>
        </header>

        <TrackingTimeline
          currentStage={currentStage}
          stages={DEMO_STAGES}
        />

        <div className="mt-8 pt-5 border-t border-border">
          <p className="m-0 mb-2.5 text-[12px] font-semibold tracking-wider uppercase text-muted">
            Demo: advance stage
          </p>
          <div className="flex flex-wrap gap-2">
            {STAGE_ORDER.map((stage) => (
              <button
                key={stage}
                onClick={() => setCurrentStage(stage)}
                aria-pressed={currentStage === stage}
                className={`text-[12px] font-medium px-3 py-1.5 rounded-full border-1.5 transition-all cursor-pointer ${
                  currentStage === stage
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-transparent text-muted hover:border-accent/50"
                }`}
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
