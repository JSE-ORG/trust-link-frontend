"use client";

import useSWR from "swr";

import { getTracking } from "@/lib/api";
import { FetchHookResult, Tracking } from "@/types";

/**
 * Polls and caches shipment tracking data for a given escrow.
 *
 * Wraps {@link getTracking} with SWR and uses an **adaptive polling
 * strategy**: the hook polls every 30 seconds while the shipment is
 * active and automatically stops when the tracking status reaches a
 * terminal state (`"delivered"`, `"disputed"`, or `"completed"`).
 *
 * Pass `null` or `undefined` as `escrowId` to conditionally skip the
 * request (e.g. before an escrow ID is known).
 *
 * @param escrowId - Unique identifier of the escrow whose shipment
 *   should be tracked, or `null`/`undefined` to disable polling.
 *
 * @returns An object containing:
 *   - `data`              – The full {@link Tracking} payload, or `null` while loading or if unavailable.
 *   - `status`            – Current shipment status string, or `null` if unavailable.
 *   - `estimatedDelivery` – ISO-8601 estimated delivery date, or `null` if unavailable.
 *   - `isLoading`         – `true` while the initial fetch is in progress.
 *   - `error`             – An `Error` instance if the request failed, otherwise `null`.
 *   - `refetch`           – SWR `mutate` function to manually revalidate the cache.
 *
 * @example
 * ```tsx
 * import { useTracking } from "@/hooks/useTracking";
 *
 * function ShipmentStatus({ escrowId }: { escrowId: string }) {
 *   const { status, estimatedDelivery, isLoading } = useTracking(escrowId);
 *
 *   if (isLoading) return <Spinner />;
 *   return (
 *     <p>
 *       Status: {status} — ETA: {estimatedDelivery ?? "N/A"}
 *     </p>
 *   );
 * }
 * ```
 *
 * @see {@link Tracking} for the shape of the returned data.
 * @see {@link useEscrow} for fetching the parent escrow record.
 */
export function useTracking(
  escrowId: string | null | undefined
): FetchHookResult<Tracking> & {
  status: string | null;
  estimatedDelivery: string | null;
  refetch: () => Promise<Tracking | undefined>;
} {
  const { data, error, isLoading, mutate } = useSWR<Tracking>(
    escrowId ? `/escrows/${escrowId}/tracking` : null,
    async () => {
      if (!escrowId) throw new Error("Escrow ID is required");
      return getTracking(escrowId);
    },
    {
      refreshInterval: (tracking: Tracking | undefined) => {
        if (!tracking) return 30000;
        const status = tracking.status.toLowerCase();
        if (status === "delivered" || status === "disputed" || status === "completed") {
          return 0;
        }
        return 30000;
      },
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  );

  return {
    data: data ?? null,
    status: data?.status ?? null,
    estimatedDelivery: data?.estimatedDelivery ?? null,
    isLoading,
    error: error instanceof Error ? error : error != null ? new Error(String(error)) : null,
    refetch: mutate,
  };
}

export default useTracking;
