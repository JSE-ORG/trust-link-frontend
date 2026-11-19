import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  Banknote,
  CheckCheck,
  CircleCheck,
  Clock,
  Package,
  RotateCcw,
  ShieldAlert,
  Truck,
} from "lucide-react";

import type { BadgeProps } from "@/components/ui/Badge";
import type { EscrowStatus } from "@/types/status";
import { EscrowStatus as EscrowStatusConst } from "@/types/status";

export type EscrowState =
  | "Pending"
  | "Funded"
  | "Shipped"
  | "Completed"
  | "Disputed"
  | "Released"
  | "Refunded"
  | "Expired";

export interface EscrowStatusConfig {
  label: string;
  variant: BadgeProps["variant"];
}

export interface EscrowStatusPresentation {
  /** Domain status display label (e.g., "Pending", "Funded"). */
  label: string;
  /** Notification action/event label (e.g., "Escrow created", "Payment received"). */
  notificationLabel: string;
  /** Lucide icon representing the status. */
  icon: LucideIcon;
  /** Badge variant for domain status badge presentation. */
  badgeVariant: BadgeProps["variant"];
  /** Text color utility class (e.g., used in notification dropdown). */
  textColor: string;
  /** Background and text utility class (e.g., used in notification row icon bubble). */
  bgClass: string;
}

/**
 * Explicit, centralized presentation metadata for every EscrowStatus.
 */
export const ESCROW_STATUS_PRESENTATION: Record<EscrowStatus, EscrowStatusPresentation> = {
  [EscrowStatusConst.PENDING]: {
    label: "Pending",
    notificationLabel: "Escrow created",
    icon: Clock,
    badgeVariant: "secondary",
    textColor: "text-zinc-500",
    bgClass: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800",
  },
  [EscrowStatusConst.FUNDED]: {
    label: "Funded",
    notificationLabel: "Payment received",
    icon: Banknote,
    badgeVariant: "default",
    textColor: "text-blue-500",
    bgClass: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  },
  [EscrowStatusConst.SHIPPED]: {
    label: "Shipped",
    notificationLabel: "Order shipped",
    icon: Truck,
    badgeVariant: "outline",
    textColor: "text-indigo-500",
    bgClass: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
  },
  [EscrowStatusConst.COMPLETED]: {
    label: "Completed",
    notificationLabel: "Order completed",
    icon: CircleCheck,
    badgeVariant: "success",
    textColor: "text-green-500",
    bgClass: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400",
  },
  [EscrowStatusConst.DISPUTED]: {
    label: "Disputed",
    notificationLabel: "Dispute raised",
    icon: ShieldAlert,
    badgeVariant: "destructive",
    textColor: "text-red-500",
    bgClass: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
  },
  [EscrowStatusConst.RELEASED]: {
    label: "Released",
    notificationLabel: "Funds released",
    icon: CheckCheck,
    badgeVariant: "success",
    textColor: "text-emerald-500",
    bgClass: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  },
  [EscrowStatusConst.REFUNDED]: {
    label: "Refunded",
    notificationLabel: "Refund processed",
    icon: RotateCcw,
    badgeVariant: "warning",
    textColor: "text-orange-500",
    bgClass: "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  },
  [EscrowStatusConst.EXPIRED]: {
    label: "Expired",
    notificationLabel: "Escrow expired",
    icon: AlertCircle,
    badgeVariant: "secondary",
    textColor: "text-zinc-400",
    bgClass: "bg-zinc-100 text-zinc-400 dark:bg-zinc-800",
  },
};

/**
 * Safe fallback presentation used when an unknown or external status is encountered.
 */
export const DEFAULT_STATUS_PRESENTATION: EscrowStatusPresentation = {
  label: "Unknown",
  notificationLabel: "Status update",
  icon: Package,
  badgeVariant: "secondary",
  textColor: "text-zinc-500",
  bgClass: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800",
};

/**
 * Resolves the presentation metadata for an arbitrary status string.
 * Normalizes input case-insensitively and returns safe defaults if unrecognized.
 */
export function getEscrowStatusPresentation(status?: string | null): EscrowStatusPresentation {
  if (!status) return DEFAULT_STATUS_PRESENTATION;
  const upper = status.toUpperCase() as EscrowStatus;
  if (upper in ESCROW_STATUS_PRESENTATION) {
    return ESCROW_STATUS_PRESENTATION[upper];
  }
  return {
    ...DEFAULT_STATUS_PRESENTATION,
    label: status,
    notificationLabel: status,
  };
}

/** Legacy TitleCase map preserved for backwards compatibility with badge consumers */
export const ESCROW_STATUS_MAP: Record<EscrowState, EscrowStatusConfig> = {
  Pending:   { label: "Pending",   variant: "secondary" },
  Funded:    { label: "Funded",    variant: "default" },
  Shipped:   { label: "Shipped",   variant: "outline" },
  Completed: { label: "Completed", variant: "success" },
  Disputed:  { label: "Disputed",  variant: "destructive" },
  Released:  { label: "Released",  variant: "success" },
  Refunded:  { label: "Refunded",  variant: "warning" },
  Expired:   { label: "Expired",   variant: "secondary" },
};

/** Tailwind text-color tokens mapped to escrow statuses */
export const STATUS_COLORS: Record<string, string> = {
  PENDING:   ESCROW_STATUS_PRESENTATION[EscrowStatusConst.PENDING].textColor,
  FUNDED:    ESCROW_STATUS_PRESENTATION[EscrowStatusConst.FUNDED].textColor,
  SHIPPED:   ESCROW_STATUS_PRESENTATION[EscrowStatusConst.SHIPPED].textColor,
  COMPLETED: ESCROW_STATUS_PRESENTATION[EscrowStatusConst.COMPLETED].textColor,
  DISPUTED:  ESCROW_STATUS_PRESENTATION[EscrowStatusConst.DISPUTED].textColor,
  RELEASED:  ESCROW_STATUS_PRESENTATION[EscrowStatusConst.RELEASED].textColor,
  REFUNDED:  ESCROW_STATUS_PRESENTATION[EscrowStatusConst.REFUNDED].textColor,
  EXPIRED:   ESCROW_STATUS_PRESENTATION[EscrowStatusConst.EXPIRED].textColor,
};

/** Tailwind background and text tokens mapped to escrow statuses */
export const STATUS_BG: Record<string, string> = {
  PENDING:   ESCROW_STATUS_PRESENTATION[EscrowStatusConst.PENDING].bgClass,
  FUNDED:    ESCROW_STATUS_PRESENTATION[EscrowStatusConst.FUNDED].bgClass,
  SHIPPED:   ESCROW_STATUS_PRESENTATION[EscrowStatusConst.SHIPPED].bgClass,
  COMPLETED: ESCROW_STATUS_PRESENTATION[EscrowStatusConst.COMPLETED].bgClass,
  DISPUTED:  ESCROW_STATUS_PRESENTATION[EscrowStatusConst.DISPUTED].bgClass,
  RELEASED:  ESCROW_STATUS_PRESENTATION[EscrowStatusConst.RELEASED].bgClass,
  REFUNDED:  ESCROW_STATUS_PRESENTATION[EscrowStatusConst.REFUNDED].bgClass,
  EXPIRED:   ESCROW_STATUS_PRESENTATION[EscrowStatusConst.EXPIRED].bgClass,
};
