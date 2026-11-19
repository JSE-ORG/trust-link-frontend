"use client";

import useSWR from "swr";

import { getEscrow } from "@/lib/api";
import { Escrow, EscrowStatusConst, FetchHookResult } from "@/types";

/**
 * Set of terminal escrow statuses where automatic periodic polling is stopped.
 * Documented policy: COMPLETED, RELEASED, REFUNDED, and EXPIRED represent
 * final settlement states where no further automated on-chain updates occur.
 * Active states (PENDING, FUNDED, SHIPPED, DISPUTED) continue polling.
 */
export const TERMINAL_ESCROW_STATUSES = new Set<string>([
  EscrowStatusConst.COMPLETED,
  EscrowStatusConst.RELEASED,
  EscrowStatusConst.REFUNDED,
  EscrowStatusConst.EXPIRED,
]);

/**
 * Determines whether an escrow status represents a terminal settlement state.
 *
 * Terminal states (COMPLETED, RELEASED, REFUNDED, EXPIRED) stop automatic
 * periodic polling, reducing network overhead on settled order pages.
 * Active states (PENDING, FUNDED, SHIPPED, DISPUTED) continue polling.
 */
export function isTerminalEscrowStatus(
  status: string | null | undefined
): boolean {
  if (!status) return false;
  return TERMINAL_ESCROW_STATUSES.has(status.toUpperCase());
}

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
 * focus-based revalidation. Stops periodic background polling once the escrow
 * reaches a terminal settlement state (COMPLETED, RELEASED, REFUNDED, EXPIRED).
 * Pass `null` or `undefined` as `escrowId` to conditionally skip the request.
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
      refreshInterval: (escrow: Escrow | undefined) => {
        if (refreshInterval === 0) return 0;
        if (escrow && isTerminalEscrowStatus(escrow.status)) {
          return 0;
        }
        return refreshInterval;
      },
      fallbackData: initialData,
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  );

  return {
    data: data ?? null,
    isLoading,
    error:
      error instanceof Error
        ? error
        : error != null
          ? new Error(String(error))
          : null,
    refetch: () => mutate(),
  };
}

export default useEscrow;
