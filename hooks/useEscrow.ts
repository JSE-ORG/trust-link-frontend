import { useState, useEffect, useCallback, useRef } from "react";
import { Escrow } from "@/types";
import { getEscrow } from "@/lib/api";

interface UseEscrowOptions {
  pollingInterval?: number;
}

export function useEscrow(id: string, options: UseEscrowOptions = {}) {
  const [data, setData] = useState<Escrow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { pollingInterval } = options;
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const result = await getEscrow(id);
      setData(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("An unknown error occurred"));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const refetch = useCallback(() => {
    setIsLoading(true);
    return fetchData();
  }, [fetchData]);

  useEffect(() => {
    setIsLoading(true);
    fetchData();

    if (pollingInterval) {
      timerRef.current = setInterval(fetchData, pollingInterval);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [fetchData, pollingInterval]);

  return { data, isLoading, error, refetch };
}
