import type { useTranslation } from "react-i18next";

import { EscrowStatusConst } from "@/types";

/** The `t` function returned by react-i18next's `useTranslation`. */
export type TranslateFn = ReturnType<typeof useTranslation>["t"];

export const STATUS_TABS = [
  "ALL",
  EscrowStatusConst.PENDING,
  EscrowStatusConst.FUNDED,
  EscrowStatusConst.SHIPPED,
  EscrowStatusConst.COMPLETED,
  EscrowStatusConst.DISPUTED,
  EscrowStatusConst.RELEASED,
  EscrowStatusConst.REFUNDED,
  EscrowStatusConst.EXPIRED,
] as const;

export const ITEMS_PER_PAGE = 10;
export const VIEW_PREF_KEY = "vendor.dashboard.viewMode";

export const CHECKBOX_CLASS =
  "h-4 w-4 cursor-pointer rounded border-zinc-300 accent-zinc-900 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 dark:border-zinc-700 dark:accent-white dark:focus-visible:ring-zinc-300";

export type ViewMode = "card" | "table";
