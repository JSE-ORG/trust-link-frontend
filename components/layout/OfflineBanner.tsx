"use client";

import { RefreshCw, WifiOff } from "lucide-react";
import { startTransition, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

/**
 * Banner that displays when the user loses network connectivity.
 *
 * Listens to the browser `online` / `offline` window events and renders a
 * non-intrusive, full-width alert bar when the device is offline.
 *
 * Includes an active "Check connection" retry button with visual loading feedback
 * to re-verify network status without a full page reload.
 *
 * The banner is visually hidden (returns `null`) when the user is online.
 *
 * @returns A red alert banner when offline, or `null` when online.
 */
export default function OfflineBanner(): React.ReactNode {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);

  useEffect(() => {
    startTransition(() => setIsOnline(navigator.onLine));

    const handleOnline = (): void => setIsOnline(true);
    const handleOffline = (): void => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleCheckConnection = async () => {
    if (isChecking) return;
    setIsChecking(true);

    try {
      let reachable = Boolean(typeof navigator !== "undefined" && navigator.onLine);

      if (reachable && typeof fetch === "function") {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 3500);
          await fetch(window.location.origin, {
            method: "HEAD",
            cache: "no-store",
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          reachable = true;
        } catch {
          reachable = typeof navigator !== "undefined" ? navigator.onLine : false;
        }
      }

      if (reachable) {
        setIsOnline(true);
        toast.success(
          t(
            "network.offlineBanner.connectionRestored",
            "Connection restored. You are back online."
          )
        );
      } else {
        toast.error(
          t(
            "network.offlineBanner.stillOffline",
            "Still offline. Please check your network connection."
          )
        );
      }
    } finally {
      setIsChecking(false);
    }
  };

  if (isOnline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex flex-wrap items-center justify-center gap-3 bg-red-600 px-4 py-2 text-sm font-medium text-white dark:bg-red-700"
    >
      <div className="flex items-center gap-2">
        <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
        <span>
          {t(
            "network.offlineBanner.message",
            "You are offline. Some features may be unavailable until your connection is restored."
          )}
        </span>
      </div>
      <button
        type="button"
        onClick={handleCheckConnection}
        disabled={isChecking}
        className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm transition hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 disabled:opacity-60 cursor-pointer"
        aria-label={
          isChecking
            ? t("network.offlineBanner.checking", "Checking...")
            : t("network.offlineBanner.checkConnection", "Check connection")
        }
      >
        <RefreshCw
          className={`h-3.5 w-3.5 shrink-0 ${isChecking ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
        <span>
          {isChecking
            ? t("network.offlineBanner.checking", "Checking...")
            : t("network.offlineBanner.checkConnection", "Check connection")}
        </span>
      </button>
    </div>
  );
}
