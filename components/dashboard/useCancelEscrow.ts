"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import { cancelEscrow } from "@/lib/api";
import { SESSION_KEY } from "@/lib/session";
import type { Escrow } from "@/types";

import type { TranslateFn } from "./vendorListShared";

interface UseCancelEscrowOptions {
  translate: TranslateFn;
  setEscrows: React.Dispatch<React.SetStateAction<Escrow[] | null>>;
}

/**
 * Owns the "cancel escrow" confirmation flow: which escrow is pending cancel,
 * the in-flight flag, and the confirm handler that calls the API and updates
 * the list (or surfaces an error) afterwards.
 */
export function useCancelEscrow({
  translate,
  setEscrows,
}: UseCancelEscrowOptions) {
  const [escrowToCancel, setEscrowToCancel] = useState<Escrow | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const handleCancelEscrow = useCallback((escrow: Escrow) => {
    setEscrowToCancel(escrow);
  }, []);

  const closeCancelDialog = useCallback(() => setEscrowToCancel(null), []);

  const confirmCancelEscrow = useCallback(async () => {
    if (!escrowToCancel) return;

    setIsCancelling(true);
    try {
      const token = window.localStorage.getItem(SESSION_KEY) || undefined;
      await cancelEscrow(escrowToCancel.id, token);

      setEscrows(
        (current) =>
          current?.filter((item) => item.id !== escrowToCancel.id) ?? current
      );

      toast.success(translate("dashboard.cancelEscrowSuccess"));
      setEscrowToCancel(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : translate("dashboard.cancelEscrowError");
      toast.error(message);
    } finally {
      setIsCancelling(false);
    }
  }, [escrowToCancel, setEscrows, translate]);

  return {
    escrowToCancel,
    isCancelling,
    handleCancelEscrow,
    closeCancelDialog,
    confirmCancelEscrow,
  };
}
