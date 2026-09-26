import React from "react";

import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";

import { ESCROW_STATUS_MAP, EscrowState } from "./escrow-status";

interface EscrowStatusBadgeProps {
  status: string;
  className?: string;
}

// Map escrow states to accessible badge variants.
export function EscrowStatusBadge({ status, className }: EscrowStatusBadgeProps) {
  // Normalize status string to Title Case to handle varying API casing safely
  const normalizedStatus = (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase());
  
  // Look up mapping, default to a safe fallback for unknown states
  const config = ESCROW_STATUS_MAP[normalizedStatus as EscrowState] || {
    label: status,
    variant: "secondary",
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
