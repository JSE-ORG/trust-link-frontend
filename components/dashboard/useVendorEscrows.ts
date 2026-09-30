"use client";

import { startTransition, useCallback, useEffect, useState } from "react";

import { getVendorEscrows } from "@/lib/api";
import type { Escrow } from "@/types";

interface UseVendorEscrowsOptions {
  /** Localized fallback message used when the fetch throws a non-Error. */
  errorMessage: string;
}

/**
 * Loads the vendor's escrows and exposes the raw list plus a reload trigger.
 * Mutations (cancel, mark-shipped) update the list through `setEscrows`.
 */
export function useVendorEscrows({ errorMessage }: UseVendorEscrowsOptions) {
  const [escrows, setEscrows] = useState<Escrow[] | null>(null);
  const [error, setError] = useState<Error | null>(null);

  const loadItems = useCallback(async () => {
    try {
      setError(null);
      const token = window.localStorage.getItem("wallet.jwt") || undefined;
      const data = await getVendorEscrows(token);
      setEscrows(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(errorMessage));
    }
  }, [errorMessage]);

  useEffect(() => {
    startTransition(() => loadItems());
  }, [loadItems]);

  const retry = useCallback(() => {
    setEscrows(null);
    void loadItems();
  }, [loadItems]);

  return { escrows, setEscrows, error, setError, loadItems, retry };
}
