"use client";

import { AlertTriangle, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

/** Remaining time is shown in a warning style below this threshold. */
export const COUNTDOWN_WARNING_MS = 60 * 60 * 1000; // 1 hour

export interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Milliseconds left; `0` once the deadline has passed. */
  totalMs: number;
}

/**
 * Splits the gap between `now` and `expiresAt` into day/hour/minute/second parts.
 *
 * @param expiresAt - ISO timestamp the escrow expires at.
 * @param now - Epoch milliseconds to measure from (defaults to the current time).
 * @returns The remaining parts, or `null` when `expiresAt` is unparseable.
 */
export function getTimeRemaining(
  expiresAt: string,
  now: number = Date.now()
): TimeRemaining | null {
  const expiry = new Date(expiresAt).getTime();
  if (Number.isNaN(expiry)) return null;

  const totalMs = Math.max(0, expiry - now);
  const totalSeconds = Math.floor(totalMs / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
    totalMs,
  };
}

/**
 * Renders remaining time as `2d 04h 13m 09s`, dropping leading units that are
 * still zero so short windows read as `13m 09s` rather than `0d 00h 13m 09s`.
 */
export function formatCountdown({ days, hours, minutes, seconds }: TimeRemaining): string {
  const pad = (n: number) => String(n).padStart(2, "0");

  if (days > 0) return `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  if (hours > 0) return `${hours}h ${pad(minutes)}m ${pad(seconds)}s`;
  if (minutes > 0) return `${minutes}m ${pad(seconds)}s`;
  return `${seconds}s`;
}

export interface EscrowCountdownProps {
  /** ISO timestamp the escrow expires at. */
  expiresAt: string;
  /** Called once, when the countdown crosses zero while mounted. */
  onExpire?: () => void;
  /** Render the expired badge immediately (e.g. status is already EXPIRED). */
  forceExpired?: boolean;
  className?: string;
}

/**
 * Live countdown to an escrow's `expiresAt`, ticking once per second.
 *
 * Three states: normal, a warning under {@link COUNTDOWN_WARNING_MS}, and an
 * "Expired" badge once the deadline passes. Parents disable funding by reacting
 * to {@link EscrowCountdownProps.onExpire}.
 */
export default function EscrowCountdown({
  expiresAt,
  onExpire,
  forceExpired = false,
  className = "",
}: EscrowCountdownProps) {
  const { t } = useTranslation();
  // Server and client clocks differ, so the first paint renders nothing and the
  // real value lands on the first effect tick.
  const [remaining, setRemaining] = useState<TimeRemaining | null>(null);

  useEffect(() => {
    let expiredFired = false;

    const tick = () => {
      const next = getTimeRemaining(expiresAt);
      setRemaining(next);

      if (next && next.totalMs === 0 && !expiredFired) {
        expiredFired = true;
        onExpire?.();
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [expiresAt, onExpire]);

  if (!remaining) return null;

  const isExpired = forceExpired || remaining.totalMs === 0;
  const isWarning = !isExpired && remaining.totalMs < COUNTDOWN_WARNING_MS;

  if (isExpired) {
    return (
      <p
        data-testid="escrow-countdown"
        className={`inline-flex items-center gap-2 rounded-full border border-red-300 bg-red-50 px-3 py-1 text-sm font-medium text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200 ${className}`}
      >
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
        <span data-testid="escrow-expired-badge">{t("payment.expiredCountdown")}</span>
      </p>
    );
  }

  return (
    <p
      data-testid="escrow-countdown"
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm ${
        isWarning
          ? "border-amber-300 bg-amber-50 font-medium text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
          : "border-zinc-200 bg-zinc-50 text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
      } ${className}`}
    >
      {isWarning ? (
        <AlertTriangle className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Clock className="h-4 w-4" aria-hidden="true" />
      )}
      <span>{t("payment.timeRemaining")}</span>
      {/* role="timer" stops assistive tech announcing every single second. */}
      <span role="timer" aria-live="off" className="font-mono tabular-nums">
        {formatCountdown(remaining)}
      </span>
    </p>
  );
}
