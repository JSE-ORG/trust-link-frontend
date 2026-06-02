"use client";

import useSWR from "swr";
import { getTracking } from "@/lib/api";
import { Tracking } from "@/types";

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
 *   - `tracking`          – The full {@link Tracking} payload, or `undefined` while loading.
 *   - `status`            – Current shipment status string, or `null` if unavailable.
 *   - `estimatedDelivery` – ISO-8601 estimated delivery date, or `null` if unavailable.
 *   - `isLoading`         – `true` while the initial fetch is in progress.
 *   - `error`             – An `Error` instance if the request failed, otherwise `undefined`.
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
export function useTracking(escrowId: string | null | undefined) {
  const { data, error, isLoading, mutate } = useSWR<Tracking>(
    escrowId ? `/escrows/${escrowId}/tracking` : null,
    async () => {
      if (!escrowId) throw new Error("Escrow ID is required");
      return getTracking(escrowId);
    },
    {
      // Poll every 30 seconds
      refreshInterval: (tracking) => {
        if (!tracking) return 30000;
        
        // Stop polling if status is terminal
        const status = tracking.status.toLowerCase();
        if (status === "delivered" || status === "disputed" || status === "completed") {
          return 0;
        }
        
        return 30000;
      },
      // SWR automatically pauses refresh when tab is inactive/invisible
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    }
  );

  return {
    tracking: data,
    status: data?.status || null,
    estimatedDelivery: data?.estimatedDelivery || null,
    isLoading,
    error,
    refetch: mutate,
  };
}

export default useTracking;
