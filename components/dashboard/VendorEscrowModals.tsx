"use client";

import ShipTrackingModal from "@/components/dashboard/ShipTrackingModal";
import ConfirmationDialog from "@/components/ui/ConfirmationDialog";
import type { Escrow } from "@/types";

import type { TranslateFn } from "./vendorListShared";

interface VendorEscrowModalsProps {
  translate: TranslateFn;
  selectedEscrow: Escrow | null;
  onCloseShipModal: () => void;
  onShipmentSuccess: (escrowId: string) => void;
  escrowToCancel: Escrow | null;
  isCancelling: boolean;
  onConfirmCancel: () => void;
  onCloseCancelDialog: () => void;
}

/**
 * The ship-tracking and cancel-confirmation modals, kept out of the main list
 * component so it stays a thin composition.
 */
export default function VendorEscrowModals({
  translate,
  selectedEscrow,
  onCloseShipModal,
  onShipmentSuccess,
  escrowToCancel,
  isCancelling,
  onConfirmCancel,
  onCloseCancelDialog,
}: VendorEscrowModalsProps) {
  return (
    <>
      {selectedEscrow && (
        <ShipTrackingModal
          escrowId={selectedEscrow.id}
          vendorName={selectedEscrow.item}
          open={Boolean(selectedEscrow)}
          onClose={onCloseShipModal}
          onSuccess={onShipmentSuccess}
        />
      )}

      <ConfirmationDialog
        open={Boolean(escrowToCancel)}
        title={translate("dashboard.cancelEscrowTitle")}
        description={translate("dashboard.cancelEscrowDescription", {
          item: escrowToCancel?.item,
        })}
        confirmLabel={translate("dashboard.cancelEscrowTitle")}
        cancelLabel={translate("dashboard.keepEscrow")}
        onConfirm={onConfirmCancel}
        onCancel={onCloseCancelDialog}
        variant="danger"
        loading={isCancelling}
      />
    </>
  );
}
