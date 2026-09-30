"use client";

import useSWR from "swr";

import { getEscrow } from "@/lib/api";
import { Escrow, FetchHookResult } from "@/types";

/**
 * Configuration options for the {@link useEscrow} hook.
 *
 * @property {number} [refreshInterval=30000] - Polling interval in milliseconds.
 *   Set to `0` to disable automatic polling.
 * @property {Escrow} [initialData] - Pre-fetched escrow data to display
 *   immediately while the first network request is in flight (SWR `fallbackData`).
 */
interface UseEscrowOptions {
  refreshInterval?: number;
  initialData?: Escrow;
}

/**
 * Fetches and caches a single escrow record, with automatic polling.
 *
 * Wraps {@link getEscrow} with SWR for caching, deduplication, and
 * focus-based revalidation. Pass `null` or `undefined` as `escrowId`
 * to conditionally skip the request.
 *
 * @param escrowId - Unique identifier of the escrow to fetch, or
 *   `null`/`undefined` to disable the request entirely.
 * @param options - Optional configuration (see {@link UseEscrowOptions}).
 *
 * @returns An object containing:
 *   - `data`      – The fetched {@link Escrow} record, or `null` while loading or if unavailable.
 *   - `isLoading` – `true` while the initial fetch is in progress.
 *   - `error`     – An `Error` instance if the request failed, otherwise `null`.
 *   - `refetch`   – SWR `mutate` function to manually revalidate the cache.
 *
 * @example
 * ```tsx
 * import { useEscrow } from "@/hooks/useEscrow";
 *
 * function EscrowDetails({ id }: { id: string }) {
 *   const { data, isLoading, error } = useEscrow(id);
 *
 *   if (isLoading) return <Spinner />;
 *   if (error)     return <p>Failed to load escrow.</p>;
 *   return <p>{data?.item} — {data?.amount} USDC</p>;
 * }
 * ```
 *
 * @see {@link Escrow} for the shape of the returned data.
 * @see {@link UseEscrowOptions} for available configuration.
 */
export function useEscrow(
  escrowId: string | null | undefined,
  options: UseEscrowOptions = {}
): FetchHookResult<Escrow> & { refetch: () => Promise<Escrow | undefined> } {
  const { refreshInterval = 30000, initialData } = options;

  const { data, error, isLoading, mutate } = useSWR<Escrow>(
    escrowId ? `/escrows/${escrowId}` : null,
    async () => {
      if (!escrowId) throw new Error("Escrow ID is required");
      return getEscrow(escrowId);
    },
    {
      refreshInterval,
      fallbackData: initialData,
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  );

  return {
    data: data ?? null,
    isLoading,
    error: error instanceof Error ? error : error != null ? new Error(String(error)) : null,
    refetch: mutate,
  };
}

export default useEscrow;
