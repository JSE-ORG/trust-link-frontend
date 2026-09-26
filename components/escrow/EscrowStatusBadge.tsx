import React from "react";

import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

import { ESCROW_STATUS_MAP, EscrowState } from "./escrow-status";

/**
 * Props for the EscrowStatusBadge component.
 */
interface EscrowStatusBadgeProps {
  /** The escrow status string (e.g., "Pending", "Funded", "Shipped"). Case-insensitive. */
  status: string;
  /** Optional additional CSS classes to apply to the badge wrapper. */
  className?: string;
}

/**
 * Displays an accessible badge indicating the current escrow status.
 *
 * Normalizes the status string to Title Case and maps it to a visual variant
 * using ESCROW_STATUS_MAP. Unknown states fall back to a secondary style.
 *
 * @example
 * ```tsx
 * <EscrowStatusBadge status="pending" />
 * <EscrowStatusBadge status="Funded" className="ml-2" />
 * ```
 */
export function EscrowStatusBadge({ status, className }: EscrowStatusBadgeProps) {
  const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

  const config = ESCROW_STATUS_MAP[normalizedStatus as EscrowState] ?? {
    label: status,
    variant: "secondary" as const,
  };

  const announcement = `Escrow status updated to: ${config.label}`;

  return (
    <Badge
      variant={config.variant}
      className={cn("whitespace-nowrap", className)}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={announcement}
    >
      Status updated to: {config.label}
    </Badge>
  );
}
