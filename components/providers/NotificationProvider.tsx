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

import { WalletContext } from "@/components/providers/WalletProvider";
import { getVendorEscrows } from "@/lib/api";
import {
  deriveNotifications,
  getReadIds,
  saveReadIds,
} from "@/lib/notifications";
import { SESSION_EXPIRED_EVENT, SESSION_KEY } from "@/lib/session";
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

/** Reads the persisted SEP-10 JWT without assuming a browser environment. */
function readSessionToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function canUseUpdates(): boolean {
  if (typeof document !== "undefined") {
    if (document.hidden || document.visibilityState === "hidden") {
      return false;
    }
  }
  if (typeof navigator !== "undefined") {
    if (navigator.onLine === false) {
      return false;
    }
  }
  return true;
}

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const wallet = useContext(WalletContext);
  // WalletProvider writes the JWT to storage; falling back to storage keeps the
  // provider usable on its own (and in tests) without a wallet ancestor.
  const sessionToken =
    wallet?.token ?? (typeof window === "undefined" ? null : readSessionToken());
  const [raw, setRaw] = useState<Omit<AppNotification, "read">[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [hasLoaded, setHasLoaded] = useState(false);
  const generationRef = useRef(0);
  const activeRef = useRef(false);
  const fetchingRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isPausedRef = useRef(false);

  const fetchNotifications = useCallback(async () => {
    if (!activeRef.current || fetchingRef.current || !canUseUpdates()) return;
    const token = readSessionToken();
    // Nothing to fetch for anonymous visitors: skip both the request and the
    // loading-state churn that would otherwise re-render every 30 seconds.
    if (!token) return;
    const generation = generationRef.current;
    fetchingRef.current = true;
    setIsLoading(true);
    try {
      const escrows = await getVendorEscrows(token);
      if (!activeRef.current || generation !== generationRef.current) return;
      setRaw(deriveNotifications(escrows));
      setHasLoaded(true);
      setError(null);
    } catch (err) {
      if (activeRef.current && generation === generationRef.current) {
        setError(
          err instanceof Error
            ? err
            : new Error("Unable to load notifications.")
        );
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
    });

    const startPolling = () => {
      if (intervalRef.current !== null || !readSessionToken()) return;
      intervalRef.current = setInterval(() => {
        if (canUseUpdates() && readSessionToken()) {
          void fetchNotifications();
        }
      }, POLL_MS);
    };

    const stopPolling = () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const initialCanUpdate = canUseUpdates();
    isPausedRef.current = !initialCanUpdate;

    // Signed-out and paused sessions start idle (isLoading initialises false)
    // and only an actual fetch flips the flag.
    if (readSessionToken() && initialCanUpdate) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- subscription start; the fetch flips isLoading asynchronously
      void fetchNotifications();
      startPolling();
    }

    const handleSync = () => {
      if (!activeRef.current) return;
      if (!readSessionToken()) {
        stopPolling();
        return;
      }
      const canUpdate = canUseUpdates();
      if (!canUpdate) {
        if (!isPausedRef.current) {
          isPausedRef.current = true;
          stopPolling();
        }
      } else {
        if (isPausedRef.current) {
          isPausedRef.current = false;
          void fetchNotifications();
          startPolling();
        }
      }
    };

    const handleAuthChange = () => {
      if (!activeRef.current) return;
      if (!readSessionToken()) {
        generationRef.current += 1;
        stopPolling();
        setRaw([]);
        setHasLoaded(false);
        setError(null);
        setIsLoading(false);
        return;
      }
      if (canUseUpdates()) {
        void fetchNotifications();
        startPolling();
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== null && event.key !== SESSION_KEY) return;
      handleAuthChange();
    };

    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", handleSync);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage);
      window.addEventListener(SESSION_EXPIRED_EVENT, handleAuthChange);
    }
    if (typeof window !== "undefined") {
      window.addEventListener("online", handleSync);
      window.addEventListener("offline", handleSync);
    }

    return () => {
      activeRef.current = false;
      generationRef.current += 1;
      fetchingRef.current = false;
      stopPolling();
      if (typeof document !== "undefined") {
        document.removeEventListener("visibilitychange", handleSync);
      }
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleSync);
        window.removeEventListener("offline", handleSync);
        window.removeEventListener("storage", handleStorage);
        window.removeEventListener(SESSION_EXPIRED_EVENT, handleAuthChange);
      }
    };
  }, [fetchNotifications, sessionToken]);

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
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        isLoading,
        error,
        hasLoaded,
        refetch: fetchNotifications,
      }}
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
