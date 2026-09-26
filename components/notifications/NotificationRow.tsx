"use client";

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
import Link from "next/link";
import type { JSX, KeyboardEvent } from "react";
import { useCallback } from "react";

import { relativeTime, statusLabel } from "@/lib/notifications";
import type { AppNotification, EscrowStatus } from "@/types";

const STATUS_BG: Record<string, string> = {
  PENDING: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800",
  FUNDED: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  SHIPPED: "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
  COMPLETED: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400",
  DISPUTED: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
  RELEASED: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  REFUNDED: "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  EXPIRED: "bg-zinc-100 text-zinc-400 dark:bg-zinc-800",
};

function StatusIcon({ type }: { type: EscrowStatus }) {
  const className = "h-5 w-5 shrink-0";
  const icons: Record<EscrowStatus, JSX.Element> = {
    PENDING: <Clock className={className} />,
    FUNDED: <Banknote className={className} />,
    SHIPPED: <Truck className={className} />,
    COMPLETED: <CircleCheck className={className} />,
    DISPUTED: <ShieldAlert className={className} />,
    RELEASED: <CheckCheck className={className} />,
    REFUNDED: <RotateCcw className={className} />,
    EXPIRED: <AlertCircle className={className} />,
  };

  return <>{icons[type] ?? <Package className={className} />}</>;
}

interface NotificationRowProps {
  /** Notification represented by the row. */
  n: AppNotification;
  /** Marks the notification as read when the row is activated. */
  onRead: (id: string) => void;
}

/** Renders a keyboard-accessible notification link. */
export function NotificationRow({ n, onRead }: NotificationRowProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLAnchorElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onRead(n.id);
      }
    },
    [n.id, onRead]
  );

  return (
    <Link
      href={`/escrow/${n.escrowId}`}
      onClick={() => onRead(n.id)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="link"
      className={`group flex items-start gap-4 rounded-2xl border p-4 transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:focus-visible:outline-white ${
        n.read
          ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
          : "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${STATUS_BG[n.type]}`}
      >
        <StatusIcon type={n.type} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {statusLabel(n.type)}
          </p>
          {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />}
        </div>
        <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">{n.escrowItem}</p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{n.message}</p>
      </div>
      <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
        {relativeTime(n.timestamp)}
      </span>
    </Link>
  );
}