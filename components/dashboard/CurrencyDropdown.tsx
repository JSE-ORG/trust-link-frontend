"use client";

import { ChevronDown, Info } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

import { type CurrencyCode,useCurrency } from "@/components/providers/CurrencyProvider";

/**
 * Display currencies offered in the dropdown, in render order.
 *
 * Declared `readonly` so the list cannot be mutated at runtime and so it can
 * double as the source of truth for {@link isCurrencyCode}.
 */
const currencies: readonly CurrencyCode[] = ["USDC", "USD", "EUR", "NGN", "GBP"];

/**
 * Type guard that narrows an arbitrary string (e.g. a `<select>` value) to a
 * supported {@link CurrencyCode}.
 *
 * Used instead of an `as CurrencyCode` cast so an unexpected value coming from
 * the DOM can never be written into the currency context.
 *
 * @param value - Raw string to check.
 * @returns `true` when `value` is one of {@link currencies}.
 */
function isCurrencyCode(value: string): value is CurrencyCode {
  return (currencies as readonly string[]).includes(value);
}

/**
 * Dashboard control for choosing the currency amounts are displayed in.
 *
 * Renders a native `<select>` bound to the global currency context plus an
 * info icon whose hover tooltip explains that converted values are approximate
 * and that escrows are always priced in USDC.
 *
 * Takes no props. State: none of its own. The current value comes from `useCurrency().currency`
 * and changes are forwarded to `useCurrency().setCurrency`, which also persists
 * the choice to `localStorage`.
 *
 * Must be rendered inside a `CurrencyProvider`, and requires i18next to be
 * initialised for the `dashboard.currency.*` translation keys.
 *
 * @example
 * ```tsx
 * <CurrencyProvider>
 *   <CurrencyDropdown />
 * </CurrencyProvider>
 * ```
 */
export default function CurrencyDropdown(): React.JSX.Element {
  const { t } = useTranslation();
  const { currency, setCurrency } = useCurrency();

  /** Forwards the selected option to the currency context, ignoring unknown values. */
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>): void => {
    const { value } = e.target;
    if (isCurrencyCode(value)) setCurrency(value);
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative group">
        <select
          value={currency}
          onChange={handleChange}
          className="appearance-none rounded-full border border-zinc-200 bg-white pl-4 pr-8 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 dark:focus:ring-zinc-300"
          aria-label={t("dashboard.currency.select")}
        >
          {currencies.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
      </div>
      <div className="group relative flex items-center justify-center">
        <Info className="h-4 w-4 text-zinc-400 hover:text-zinc-600 transition dark:text-zinc-500 dark:hover:text-zinc-300" />
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-48 rounded-lg bg-zinc-900 p-2 text-xs text-zinc-50 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 pointer-events-none z-10 dark:bg-white dark:text-zinc-900 text-center">
          {t("dashboard.currency.info")}
        </div>
      </div>
    </div>
  );
}
