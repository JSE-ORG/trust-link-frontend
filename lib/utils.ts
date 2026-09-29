/**
 * Merges CSS class names together, filtering out falsy values.
 *
 * @param classes - Variadic list of class names, conditionals, or undefined/null values.
 * @returns Space-separated concatenated class name string.
 */
export function cn(...classes: Array<string | undefined | null | false>) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Formats a date into a localized relative time string using Intl.RelativeTimeFormat.
 *
 * @param date - Date object, ISO string, or timestamp number.
 * @param locale - BCP 47 language tag (defaults to "en").
 * @returns Relative time description (e.g. "in 2 hours", "3 days ago").
 */
export function formatTimeAgo(date: string | number | Date, locale = "en"): string {
  const d = new Date(date);
  const now = new Date();
  const diffInSeconds = Math.floor((d.getTime() - now.getTime()) / 1000);

  const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { unit: "year", seconds: 31536000 },
    { unit: "month", seconds: 2592000 },
    { unit: "week", seconds: 604800 },
    { unit: "day", seconds: 86400 },
    { unit: "hour", seconds: 3600 },
    { unit: "minute", seconds: 60 },
    { unit: "second", seconds: 1 },
  ];

  for (const { unit, seconds } of units) {
    if (Math.abs(diffInSeconds) >= seconds || unit === "second") {
      const value = Math.round(diffInSeconds / seconds);
      return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(value, unit);
    }
  }

  return "";
}
