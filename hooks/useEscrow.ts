"use client";

import useSWR from "swr";
import { getEscrow } from "@/lib/api";
import { Escrow } from "@/types";

interface UseEscrowOptions {
  refreshInterval?: number;
  initialData?: Escrow;
}

/**
 * Hook to fetch and manage escrow data.
 * @param escrowId - The ID of the escrow to fetch
 * @param options - SWR options including refreshInterval (defaults to 30s)
 * @returns { escrow, isLoading, error, refetch }
 */
export function useEscrow(escrowId: string | null | undefined, options: UseEscrowOptions = {}) {
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
    escrow: data,
    isLoading,
    error,
    refetch: mutate,
  };
}

export default useEscrow;
