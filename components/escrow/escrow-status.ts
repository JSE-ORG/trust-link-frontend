import { BadgeProps } from "@/components/ui/Badge";

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
