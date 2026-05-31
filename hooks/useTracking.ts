"use client";

import useSWR from "swr";
import { getTracking } from "@/lib/api";
import { Tracking } from "@/types";

/**
 * Hook to poll and manage shipment tracking data.
 * @param escrowId - The ID of the escrow to track
 * @returns { tracking, status, estimatedDelivery, isLoading, refetch }
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
