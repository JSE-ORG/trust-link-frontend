"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  getVendorNotificationPreferences,
  patchVendorNotifications,
  VendorNotificationPreferences,
} from "@/lib/api";
import useWallet from "@/hooks/useWallet";
import { Skeleton } from "@/components/ui/Skeleton";

type EventKey = keyof VendorNotificationPreferences;

const EVENTS: { key: EventKey; label: string }[] = [
  { key: "funded",    label: "Funded"    },
  { key: "shipped",   label: "Shipped"   },
  { key: "delivered", label: "Delivered" },
  { key: "disputed",  label: "Disputed"  },
  { key: "completed", label: "Completed" },
];

const DEFAULT_PREFS: VendorNotificationPreferences = {
  funded:    { email: false, sms: false },
  shipped:   { email: false, sms: false },
  delivered: { email: false, sms: false },
  disputed:  { email: false, sms: false },
  completed: { email: false, sms: false },
};

export default function NotificationSettingsPage() {
  const { token } = useWallet();
  const [prefs, setPrefs] = useState<VendorNotificationPreferences>(DEFAULT_PREFS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    getVendorNotificationPreferences(token)
      .then(setPrefs)
      .catch(() => setLoadError("Failed to load notification preferences."))
      .finally(() => setIsLoading(false));
  }, [token]);

  function toggle(event: EventKey, channel: "email" | "sms") {
    setPrefs((prev) => ({
      ...prev,
      [event]: { ...prev[event], [channel]: !prev[event][channel] },
    }));
  }

  async function handleSave() {
    if (!token) {
      toast.error("Connect your wallet to save preferences.");
      return;
    }
    setIsSaving(true);
    try {
      await patchVendorNotifications(prefs, token);
      toast.success("Notification preferences saved.");
    } catch {
      toast.error("Failed to save preferences. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-1 text-2xl font-semibold text-zinc-950 dark:text-white">
        Notification Preferences
      </h1>
      <p className="mb-8 text-sm text-zinc-500 dark:text-zinc-400">
        Choose how you want to be notified for each escrow event.
      </p>

      <div className="rounded-3xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        {/* Header row */}
        <div className="grid grid-cols-[1fr_80px_80px] items-center border-b border-zinc-100 px-6 py-3 dark:border-zinc-800">
          <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Event
          </span>
          <span className="text-center text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Email
          </span>
          <span className="text-center text-xs font-semibold uppercase tracking-wide text-zinc-500">
            SMS
          </span>
        </div>

        {/* Event rows */}
        {isLoading ? (
          <div className="space-y-px">
            {EVENTS.map(({ key }) => (
              <div
                key={key}
                className="grid grid-cols-[1fr_80px_80px] items-center px-6 py-4"
              >
                <Skeleton className="h-4 w-24" />
                <div className="flex justify-center">
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
                <div className="flex justify-center">
                  <Skeleton className="h-6 w-11 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : loadError ? (
          <p className="px-6 py-8 text-center text-sm text-red-600 dark:text-red-400">
            {loadError}
          </p>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {EVENTS.map(({ key, label }) => (
              <div
                key={key}
                className="grid grid-cols-[1fr_80px_80px] items-center px-6 py-4"
              >
                <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">
                  {label}
                </span>
                {(["email", "sms"] as const).map((channel) => (
                  <div key={channel} className="flex justify-center">
                    <button
                      role="switch"
                      aria-checked={prefs[key][channel]}
                      aria-label={`${label} ${channel}`}
                      onClick={() => toggle(key, channel)}
                      className={`relative inline-flex h-6 w-11 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-950 ${
                        prefs[key][channel]
                          ? "bg-zinc-900 dark:bg-zinc-100"
                          : "bg-zinc-200 dark:bg-zinc-700"
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out dark:bg-zinc-900 ${
                          prefs[key][channel] ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Save button */}
        <div className="border-t border-zinc-100 px-6 py-4 dark:border-zinc-800">
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading || !!loadError}
            className="rounded-2xl bg-zinc-900 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {isSaving ? "Saving…" : "Save preferences"}
          </button>
        </div>
      </div>
    </div>
  );
}
