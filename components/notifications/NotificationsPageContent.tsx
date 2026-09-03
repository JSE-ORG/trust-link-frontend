"use client";

import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Bell,
  CheckCheck,
  CircleCheck,
  Clock,
  Package,
  RotateCcw,
  Search,
  ShieldAlert,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { JSX } from "react";
import { Suspense, useEffect, useMemo, useState } from "react";

import { useNotifications } from "@/components/providers/NotificationProvider";
import { Skeleton } from "@/components/ui/Skeleton";
import { relativeTime, statusLabel } from "@/lib/notifications";
import type { AppNotification, EscrowStatus } from "@/types";

function StatusIcon({ type }: { type: EscrowStatus }) {
  const cls = "h-5 w-5 shrink-0";
  const map: Record<EscrowStatus, JSX.Element> = {
    PENDING:   <Clock className={cls} />,
    FUNDED:    <Banknote className={cls} />,
    SHIPPED:   <Truck className={cls} />,
    COMPLETED: <CircleCheck className={cls} />,
    DISPUTED:  <ShieldAlert className={cls} />,
    RELEASED:  <CheckCheck className={cls} />,
    REFUNDED:  <RotateCcw className={cls} />,
    EXPIRED:   <AlertCircle className={cls} />,
  };
  return <>{map[type] ?? <Package className={cls} />}</>;
}

const STATUS_BG: Record<string, string> = {
  PENDING:   "bg-zinc-100 text-zinc-500 dark:bg-zinc-800",
  FUNDED:    "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
  SHIPPED:   "bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400",
  COMPLETED: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400",
  DISPUTED:  "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
  RELEASED:  "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
  REFUNDED:  "bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400",
  EXPIRED:   "bg-zinc-100 text-zinc-400 dark:bg-zinc-800",
};

const NOTIFICATIONS_PER_PAGE = 20;

function NotificationRow({ n, onRead }: { n: AppNotification; onRead: (id: string) => void }) {
  return (
    <Link
      href={`/escrow/${n.escrowId}`}
      onClick={() => onRead(n.id)}
      className={`group flex items-start gap-4 rounded-2xl border p-4 transition hover:shadow-md ${
        n.read
          ? "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950"
          : "border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950/20"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          STATUS_BG[n.type]
        }`}
      >
        <StatusIcon type={n.type} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {statusLabel(n.type)}
          </p>
          {!n.read && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-blue-500" />
          )}
        </div>
        <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-400">
          {n.escrowItem}
        </p>
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">
          {n.message}
        </p>
      </div>
      <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
        {relativeTime(n.timestamp)}
      </span>
    </Link>
  );
}

function NotificationsSkeleton() {
  return (
    <div className="space-y-3" role="status" aria-live="polite" aria-label="Loading notifications">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className="flex items-start gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
        >
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-48 max-w-full" />
            <Skeleton className="h-3 w-full" />
          </div>
          <Skeleton className="h-3 w-12 shrink-0" />
        </div>
      ))}
    </div>
  );
}

function NotificationsContent() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading } =
    useNotifications();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotifications = useMemo(() => {
    if (!searchQuery.trim()) return notifications;
    const query = searchQuery.toLowerCase();
    return notifications.filter(
      (n) =>
        n.escrowItem.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query)
    );
  }, [notifications, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredNotifications.length / NOTIFICATIONS_PER_PAGE)
  );

  // Live updates can shrink the list out from under the current page.
  const effectivePage = Math.min(currentPage, totalPages);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  const paginatedNotifications = useMemo(() => {
    const startIndex = (effectivePage - 1) * NOTIFICATIONS_PER_PAGE;
    return notifications.slice(startIndex, startIndex + NOTIFICATIONS_PER_PAGE);
  }, [notifications, effectivePage]);

  useEffect(() => {
    const jwt = window.localStorage.getItem("wallet.jwt");
    if (!jwt) {
      router.push("/");
    } else {
      const frame = window.requestAnimationFrame(() => setIsChecking(false));
      return () => window.cancelAnimationFrame(frame);
    }
  }, [router]);

  if (isChecking) {
    return (
      <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-7 w-48" />
          </div>
          <NotificationsSkeleton />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 transition hover:bg-zinc-100 dark:hover:bg-zinc-800"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-zinc-700 dark:text-zinc-300" />
              <h1 className="text-2xl font-semibold text-zinc-950 dark:text-white">
                Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
            >
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </button>
          )}
        </div>

        {isLoading && notifications.length === 0 ? (
          <NotificationsSkeleton />
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-3xl border border-zinc-200 bg-white py-16 dark:border-zinc-800 dark:bg-zinc-950">
            <Bell className="mb-3 h-10 w-10 text-zinc-300 dark:text-zinc-600" />
            <p className="text-base font-medium text-zinc-500 dark:text-zinc-400">
              No notifications yet
            </p>
            <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">
              Escrow events will appear here.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 rounded-full bg-zinc-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-full border border-zinc-200 bg-white py-2 pl-10 pr-4 text-sm text-zinc-900 focus:border-black focus:outline-none focus:ring-1 focus:ring-black focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:border-white dark:focus:ring-white dark:focus-visible:ring-zinc-300"
                  data-testid="notifications-search"
                />
              </div>
            </div>

            {filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white py-12 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No notifications match your search.
                </p>
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="mt-4 text-sm font-medium text-black hover:underline dark:text-white"
                >
                  Clear search
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {paginatedNotifications.map((n) => (
                    <NotificationRow key={n.id} n={n} onRead={markAsRead} />
                  ))}
                </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between border-t border-zinc-200 pt-6 dark:border-zinc-800">
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Showing page{" "}
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {effectivePage}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {totalPages}
                  </span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={effectivePage === 1}
                    className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={effectivePage === totalPages}
                    className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
              </>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function NotificationsPageContent() {
  return (
    <Suspense fallback={null}>
      <NotificationsContent />
    </Suspense>
  );
}
