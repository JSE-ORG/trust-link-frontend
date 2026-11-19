"use client";

import { startTransition, useCallback, useEffect, useRef, useState } from "react";

import { getVendorEscrows } from "@/lib/api";
import { SESSION_KEY } from "@/lib/session";
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
  const latestRequestRef = useRef(0);

  const loadItems = useCallback(async () => {
    const requestId = ++latestRequestRef.current;
    try {
      setError(null);
      const token = window.localStorage.getItem(SESSION_KEY) || undefined;
      const data = await getVendorEscrows(token);
      if (requestId === latestRequestRef.current) setEscrows(data);
    } catch (err) {
      if (requestId === latestRequestRef.current) {
        setError(err instanceof Error ? err : new Error(errorMessage));
      }
    }
  }, [errorMessage]);

  useEffect(() => {
    startTransition(() => loadItems());
    return () => {
      latestRequestRef.current += 1;
    };
  }, [loadItems]);

  const retry = useCallback(() => {
    setEscrows(null);
    void loadItems();
  }, [loadItems]);

  return { escrows, setEscrows, error, setError, loadItems, retry };
}
