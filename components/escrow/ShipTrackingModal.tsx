import React, { useEffect, useRef } from "react";

interface ShipTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}

export const ShipTrackingModal: React.FC<ShipTrackingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  triggerRef,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // Restore focus to trigger element when modal closes
  useEffect(() => {
    if (!isOpen && triggerRef.current) {
      triggerRef.current.focus();
    }
  }, [isOpen, triggerRef]);

  // Handle Escape key press
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
    >
      <div
        ref={modalRef}
        className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4"
      >
        <h2 id="modal-title" className="text-lg font-semibold mb-4">
          Mark Order as Shipped
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Enter shipment details and notify the buyer that their item is on the way.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSubmit();
              onClose();
            }}
            className="px-4 py-2 text-sm bg-primary text-white rounded-md hover:opacity-90"
          >
            Confirm Shipment
          </button>
        </div>
      </div>
    </div>
  );
};
export default ShipTrackingModal;
