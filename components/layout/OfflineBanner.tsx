"use client";

import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

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
