"use client";

import Link from "next/link";

import { getEscrowStatusPresentation, STATUS_BG } from "@/components/escrow/escrow-status";
import { relativeTime, statusLabel } from "@/lib/notifications";
import type { AppNotification, EscrowStatus } from "@/types";

function StatusIcon({ type }: { type: EscrowStatus }) {
  const className = "h-5 w-5 shrink-0";
  const { icon: Icon } = getEscrowStatusPresentation(type);
  return <Icon className={className} />;
}

interface NotificationRowProps {
  /** Notification represented by the row. */
  n: AppNotification;
  /** Marks the notification as read when the row is activated. */
  onRead: (id: string) => void;
}

/** Uses native link activation: Enter follows the link; Space scrolls the page. */
export function NotificationRow({ n, onRead }: NotificationRowProps) {
  return (
    <Link
      href={`/track/${n.escrowId}`}
      onClick={() => onRead(n.id)}
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
