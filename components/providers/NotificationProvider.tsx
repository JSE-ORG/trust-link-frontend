"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { getVendorEscrows } from "@/lib/api";
import {
  deriveNotifications,
  getReadIds,
  saveReadIds,
} from "@/lib/notifications";
import type { AppNotification } from "@/types";

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  isLoading: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

const POLL_MS = 30_000;

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [raw, setRaw] = useState<Omit<AppNotification, "read">[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    const token =
      typeof window !== "undefined"
        ? (localStorage.getItem("wallet.jwt") ?? undefined)
        : undefined;
    if (!token) return;
    try {
      const escrows = await getVendorEscrows(token);
      setRaw(deriveNotifications(escrows));
    } catch {
      // silently ignore — stale data is fine
    }
  }, []);

  useEffect(() => {
    setReadIds(getReadIds());
    setIsLoading(true);
    fetchNotifications().finally(() => setIsLoading(false));

    intervalRef.current = setInterval(fetchNotifications, POLL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications]);

  const notifications: AppNotification[] = raw.map((n) => ({
    ...n,
    read: readIds.has(n.id),
  }));

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback(
    (id: string) => {
      setReadIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        saveReadIds(next);
        return next;
      });
    },
    []
  );

  const markAllAsRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      raw.forEach((n) => next.add(n.id));
      saveReadIds(next);
      return next;
    });
  }, [raw]);

  return (
    <NotificationContext.Provider
      value={{ notifications, unreadCount, markAsRead, markAllAsRead, isLoading }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
