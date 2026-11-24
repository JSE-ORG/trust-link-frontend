"use client";

import { useRouter } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

import { useNotifications } from "@/components/providers/NotificationProvider";
import Pagination from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { SESSION_KEY } from "@/lib/session";

import { NotificationFetchFeedback } from "./NotificationFetchFeedback";
import { NotificationRow } from "./NotificationRow";
import {
  NotificationsEmptyState,
  NotificationsSearchEmptyState,
} from "./NotificationsEmptyState";
import { NotificationsSkeleton } from "./NotificationsSkeleton";
import {
  NotificationsSearch,
  NotificationsToolbar,
} from "./NotificationsToolbar";

const NOTIFICATIONS_PER_PAGE = 20;

/** Coordinates authentication, notification state, filtering, and pagination. */
function NotificationsContent() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const { notifications, unreadCount, markAsRead, markAllAsRead, isLoading, error, hasLoaded, refetch } =
    useNotifications();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const filteredNotifications = useMemo(() => {
    if (!searchQuery.trim()) return notifications;
    const query = searchQuery.toLowerCase();
    return notifications.filter(
      (notification) =>
        notification.escrowItem.toLowerCase().includes(query) ||
        notification.message.toLowerCase().includes(query)
    );
  }, [notifications, searchQuery]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredNotifications.length / NOTIFICATIONS_PER_PAGE)
  );
  const effectivePage = Math.min(currentPage, totalPages);

  const paginatedNotifications = useMemo(() => {
    const startIndex = (effectivePage - 1) * NOTIFICATIONS_PER_PAGE;
    return filteredNotifications.slice(startIndex, startIndex + NOTIFICATIONS_PER_PAGE);
  }, [filteredNotifications, effectivePage]);

  useEffect(() => {
    const jwt = window.localStorage.getItem(SESSION_KEY);
    if (!jwt) {
      router.push("/");
      return;
    }
    const frame = window.requestAnimationFrame(() => setIsChecking(false));
    return () => window.cancelAnimationFrame(frame);
  }, [router]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
        <div className="mx-auto max-w-2xl">
          <div className="mb-6 flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-7 w-48" />
          </div>
          <NotificationsSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 dark:bg-black">
      <div className="mx-auto max-w-2xl">
        <NotificationsToolbar
          unreadCount={unreadCount}
          onBack={() => router.back()}
          onMarkAllAsRead={markAllAsRead}
        />
        <NotificationFetchFeedback error={error} isLoading={isLoading} hasLoaded={hasLoaded} refetch={refetch} />
        {isLoading && !error && notifications.length === 0 ? (
          <NotificationsSkeleton />
        ) : notifications.length === 0 ? (
          error ? null : <NotificationsEmptyState />
        ) : (
          <>
            <NotificationsSearch value={searchQuery} onChange={handleSearchChange} />
            {filteredNotifications.length === 0 ? (
              <NotificationsSearchEmptyState onClear={() => handleSearchChange("")} />
            ) : (
              <>
                <div className="space-y-2">
                  {paginatedNotifications.map((notification) => (
                    <NotificationRow
                      key={notification.id}
                      n={notification}
                      onRead={markAsRead}
                    />
                  ))}
                </div>
                <Pagination
                  currentPage={effectivePage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                  hideOnSinglePage
                />
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Page-level entry point wrapped in a Suspense boundary for hydration. */
export default function NotificationsPageContent() {
  return (
    <Suspense fallback={null}>
      <NotificationsContent />
    </Suspense>
  );
}