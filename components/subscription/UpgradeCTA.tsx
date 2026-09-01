"use client";

import { Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { useSubscription } from "@/components/providers/SubscriptionProvider";

const DISMISS_KEY = "dashboard.upgradeCta.dismissed";

function isDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DISMISS_KEY) === "1";
}

function persistDismiss() {
  if (typeof window === "undefined") return;
  localStorage.setItem(DISMISS_KEY, "1");
}

export default function UpgradeCTA() {
  const { t } = useTranslation();
  const { isPro, isLoading } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  const visible = !isLoading && !isPro && !isDismissed() && !dismissed;

  const dismiss = useCallback(() => {
    setDismissed(true);
    persistDismiss();
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="mb-6 flex items-start justify-between gap-4 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 dark:border-amber-900/40 dark:bg-amber-950/20"
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
          <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </span>
        <div>
          <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
            {t("dashboard.upgradeCtaTitle")}
          </p>
          <p className="mt-0.5 text-sm text-amber-700 dark:text-amber-400">
            {t("dashboard.upgradeCtaMessage")}
          </p>
          <Link
            href="/pricing"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-500 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-amber-600"
          >
            <Sparkles className="h-3 w-3" />
            {t("dashboard.upgradeCtaButton")}
          </Link>
        </div>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 rounded-full p-1 text-amber-600 transition hover:bg-amber-100 dark:hover:bg-amber-900/40"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
