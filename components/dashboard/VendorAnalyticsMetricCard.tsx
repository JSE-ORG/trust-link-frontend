import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Properties for the MetricCard component.
 */
export interface MetricCardProps {
  /** The primary label describing the metric. */
  label: string;
  /** The formatted value of the metric to display. */
  value: string;
  /** Additional context or secondary text below the value. */
  hint: string;
  /** An icon component to visually represent the metric. */
  icon: ReactNode;
  /** CSS class names defining the color and background of the icon container. */
  tone: string;
}

/**
 * A card component that displays a single metric with a label, value, hint, and icon.
 */
export function MetricCard({ label, value, hint, icon, tone }: MetricCardProps) {
  return (
    <div className="rounded-3xl border border-zinc-200/80 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 dark:text-white">{value}</p>
          <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{hint}</p>
        </div>
        <div className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl", tone)}>
          {icon}
        </div>
      </div>
    </div>
  );
}
