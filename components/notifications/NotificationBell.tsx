"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Package, Banknote, Truck, ShieldAlert, RotateCcw, CircleCheck, Clock, AlertCircle } from "lucide-react";
import { useNotifications } from "@/components/providers/NotificationProvider";
import { relativeTime, statusLabel } from "@/lib/notifications";
import type { EscrowStatus } from "@/types";

function StatusIcon({ type }: { type: EscrowStatus }) {
  const cls = "h-4 w-4 shrink-0";
  const icons: Record<EscrowStatus, JSX.Element> = {
    PENDING:   <Clock className={cls} />,
    FUNDED:    <Banknote className={cls} />,
    SHIPPED:   <Truck className={cls} />,
    COMPLETED: <CircleCheck className={cls} />,
    DISPUTED:  <ShieldAlert className={cls} />,
    RELEASED:  <CheckCheck className={cls} />,
    REFUNDED:  <RotateCcw className={cls} />,
    EXPIRED:   <AlertCircle className={cls} />,
  };
  return <>{icons[type] ?? <Package className={cls} />}</>;
}

const STATUS_COLORS: Record<EscrowStatus, string> = {
  PENDING:   "text-zinc-500",
  FUNDED:    "text-blue-500",
  SHIPPED:   "text-indigo-500",
  COMPLETED: "text-green-500",
  DISPUTED:  "text-red-500",
  RELEASED:  "text-emerald-500",
  REFUNDED:  "text-orange-500",
  EXPIRED:   "text-zinc-400",
};

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const preview = notifications.slice(0, 5);

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-950"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Notifications
            </span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <ul className="max-h-72 overflow-y-auto">
            {preview.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-zinc-400 dark:text-zinc-500">
                No notifications yet
              </li>
            ) : (
              preview.map((n) => (
                <li key={n.id}>
                  <Link
                    href={`/escrow/${n.escrowId}`}
                    onClick={() => {
                      markAsRead(n.id);
                      setOpen(false);
                    }}
                    className={`flex items-start gap-3 px-4 py-3 transition hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                      !n.read ? "bg-blue-50/60 dark:bg-blue-950/20" : ""
                    }`}
                  >
                    <span className={`mt-0.5 ${STATUS_COLORS[n.type]}`}>
                      <StatusIcon type={n.type} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
                        {statusLabel(n.type)} — {n.escrowItem}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                        {n.message}
                      </p>
                      <p className="mt-1 text-[10px] text-zinc-400 dark:text-zinc-500">
                        {relativeTime(n.timestamp)}
                      </p>
                    </div>
                    {!n.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                  </Link>
                </li>
              ))
            )}
          </ul>

          {/* Footer */}
          <div className="border-t border-zinc-100 px-4 py-2 dark:border-zinc-800">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="block text-center text-xs font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              View all notifications
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
