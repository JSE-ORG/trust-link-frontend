"use client";

import { useEffect, useState } from "react";

import { VIEW_PREF_KEY, type ViewMode } from "./vendorListShared";

function readStoredViewMode(): ViewMode {
  if (typeof window === "undefined") return "card";
  try {
    const saved = window.localStorage.getItem(VIEW_PREF_KEY);
    return saved === "card" || saved === "table" ? saved : "card";
  } catch {
    return "card";
  }
}

/**
 * Owns the card/table view preference.
 *
 * The saved preference is read through a lazy `useState` initializer rather
 * than synced in an effect, so the first client render already reflects the
 * stored value and no `react-hooks/set-state-in-effect` override is needed.
 */
export function useViewModePreference(): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewMode] = useState<ViewMode>(readStoredViewMode);

  useEffect(() => {
    try {
      window.localStorage.setItem(VIEW_PREF_KEY, viewMode);
    } catch {
      // ignore - localStorage unavailable
    }
  }, [viewMode]);

  return [viewMode, setViewMode];
}
