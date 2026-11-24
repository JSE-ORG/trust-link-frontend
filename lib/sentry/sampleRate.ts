/**
 * Sentry traces sample rate configuration and validation.
 *
 * Ensures all runtimes (client, server, edge) apply a finite rate in the supported
 * 0.0 - 1.0 range, falling back to a documented bounded default when absent or invalid.
 */

/** Documented bounded default: 10% sampling in production */
export const DEFAULT_TRACES_SAMPLE_RATE = 0.1;

/**
 * Parses and validates a traces sample rate.
 *
 * Supported values: finite numbers in the range [0.0, 1.0].
 * Any missing, non-numeric, or out-of-range value safely falls back to the default.
 */
export function parseTracesSampleRate(
  value: string | number | undefined | null,
  fallback: number = DEFAULT_TRACES_SAMPLE_RATE
): number {
  if (value === undefined || value === null) {
    return fallback;
  }

  if (typeof value === "string" && value.trim() === "") {
    return fallback;
  }

  const num = typeof value === "number" ? value : Number(String(value).trim());

  if (Number.isFinite(num) && num >= 0 && num <= 1) {
    return num;
  }

  return fallback;
}

/**
 * Resolves the configured traces sample rate from environment variables.
 * Checks runtime-specific and public variables:
 * - SENTRY_TRACES_SAMPLE_RATE
 * - NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
 */
export function getTracesSampleRate(): number {
  const raw =
    process.env.SENTRY_TRACES_SAMPLE_RATE ??
    process.env.NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE;

  return parseTracesSampleRate(raw);
}
