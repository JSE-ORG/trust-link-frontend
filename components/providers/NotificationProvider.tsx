"use client";

import React, {
  createContext,
  startTransition,
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
import { SESSION_KEY } from "@/lib/session";
import type { AppNotification } from "@/types";

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  isLoading: boolean;
  error: Error | null;
  hasLoaded: boolean;
  refetch: () => Promise<void>;
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const generationRef = useRef(0);
  const activeRef = useRef(false);
  const fetchingRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!activeRef.current || fetchingRef.current) return;
    const generation = generationRef.current;
    fetchingRef.current = true;
    setIsLoading(true);
    try {
      const token = localStorage.getItem(SESSION_KEY);
      if (!token) return;
      const escrows = await getVendorEscrows(token);
      if (!activeRef.current || generation !== generationRef.current) return;
      setRaw(deriveNotifications(escrows));
      setHasLoaded(true);
      setError(null);
    } catch (err) {
      if (activeRef.current && generation === generationRef.current) {
        setError(err instanceof Error ? err : new Error("Unable to load notifications."));
      }
    } finally {
      if (activeRef.current && generation === generationRef.current) {
        fetchingRef.current = false;
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    activeRef.current = true;
    startTransition(() => {
      setReadIds(getReadIds());
      void fetchNotifications();
    });
    const interval = setInterval(() => void fetchNotifications(), POLL_MS);
    return () => {
      clearInterval(interval);
      activeRef.current = false;
      generationRef.current += 1;
      fetchingRef.current = false;
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
      value={{ notifications, unreadCount, markAsRead, markAllAsRead, isLoading, error, hasLoaded, refetch: fetchNotifications }}
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
