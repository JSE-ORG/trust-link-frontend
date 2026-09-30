import { SESSION_EXPIRED_EVENT, handleSessionExpired } from '../../lib/auth/constants';
"use client";

import { Sparkles, X } from "lucide-react";
import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18n";

import CurrencyDropdown from "@/components/dashboard/CurrencyDropdown";
import DashboardSection from "@/components/dashboard/DashboardSection";
import ErrorBoundary from "@/components/layout/ErrorBoundary";
import NotificationBell from "@/components/notifications/NotificationBell";
import UpgradeCTA from "@components/subscription/UpgradeCTA";
import { Skeleton } from "@/components/ui/Skeleton";
import { SESSION_KEY, SESSION_EXPIRED_EVENT } from "@/lib/session";

function UpgradeBanner({ onDismiss }: { onDismiss: () => void }) {
  const { t } = useTranslation();
  return (
    <div
      role="alert"
      className="mb-6 flex items-start justify-between gap-4 rounded-2xl bg-amber-50 px-5 py-4 dark:bg-amber-950/30"
    >
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 shrink-0 text-amber-500" />
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            {t("dashboard.upgradeBannerTitle")}
          </p>
          <p className="text-sm text-amber-700 dark:text-amber-400">
            {t("dashboard.upgradeBannerMessage")}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t("dashboard.dismiss")}
        className="shrink-0 rounded-full p-1 text-amber-600 transition hover:bg-amber-100 dark:hover:bg-amber-900/40"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export default function DashboardClient() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isChecking, setIsChecking] = useState(true);
  const [showUpgradeBanner, setShowUpgradeBanner] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const didStrip = useRef(false);

  useEffect(() => {
    const storedSession = window.localStorage.getItem(SESSION_KEY);
    if (!storedSession) {
      router.push("/");
    } else {
      const frame = window.requestAnimationFrame(() => setIsChecking(false));
      return () => window.cancelAnimationFrame(frame);
    }
  }, [router]);

export function DashboardClient() {
  useEffect(() => {
    const handleUnauthorized = () => handleSessionExpired();
    if (searchParams.get("upgraded") === "1" && !didStrip.current) {
      didStrip.current = true;
      setShowUpgradeBanner(true);
      const url = new URL(window.location.href);
      url.searchParams.delete("upgraded");
      window.history.replaceState({}, "", url.toString());
    }
  }, [searchParams]);

  useEffect(() => {
    // This event is dispatched by the API client when a 401 is received.
    // See lib/session.ts for the dispatch logic.
    const handleUnauthorized = () => {
      window.localStorage.removeItem(SESSION_KEY);
      setSessionExpired(true);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleUnauthorized);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, handleUnauthorized);
  }, []);

  return <div>Dashboard Content</div>;
}