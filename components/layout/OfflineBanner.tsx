"use client";

import { WifiOff } from "lucide-react";
import { startTransition, useEffect, useState } from "react";

/**
 * Banner that displays when the user loses network connectivity.
 *
 * Listens to the browser `online` / `offline` window events and renders a
 * non-intrusive, full-width alert bar when the device is offline.
 *
 * The banner is visually hidden (returns `null`) when the user is online.
 *
 * @returns A red alert banner when offline, or `null` when online.
 */
export default function OfflineBanner(): React.ReactNode {
  const [isOnline, setIsOnline] = useState<boolean>(true);

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

  if (isOnline) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="flex items-center justify-center gap-2 bg-red-600 px-4 py-2 text-sm font-medium text-white dark:bg-red-700"
    >
      <WifiOff className="h-4 w-4 shrink-0" />
      You are offline. Some features may be unavailable until your connection is restored.
    </div>
  );
}
