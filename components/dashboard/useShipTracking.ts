"use client";

import { useCallback, useState } from "react";

import type { Escrow } from "@/types";
import { EscrowStatusConst } from "@/types";

interface UseShipTrackingOptions {
  setEscrows: React.Dispatch<React.SetStateAction<Escrow[] | null>>;
  reload: () => void;
}

/**
 * Owns the "mark shipped" modal target and applies the shipped status to the
 * matching escrow on success.
 */
export function useShipTracking({ setEscrows, reload }: UseShipTrackingOptions) {
  const [selectedEscrow, setSelectedEscrow] = useState<Escrow | null>(null);

  const handleMarkShipped = useCallback((escrow: Escrow) => {
    setSelectedEscrow(escrow);
  }, []);

  const closeShipModal = useCallback(() => setSelectedEscrow(null), []);

  const handleShipmentSuccess = useCallback(
    (escrowId: string) => {
      setEscrows(
        (current) =>
          current?.map((item) =>
            item.id === escrowId
              ? { ...item, status: EscrowStatusConst.SHIPPED }
              : item
          ) ?? current
      );
      reload();
    },
    [setEscrows, reload]
  );

  return {
    selectedEscrow,
    handleMarkShipped,
    closeShipModal,
    handleShipmentSuccess,
  };
}
