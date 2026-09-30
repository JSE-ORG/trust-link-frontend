import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, CircularProgress, Snackbar } from '@mui/material';
import { createApiClient } from '../../lib/api-client';

interface ConfirmDeliveryButtonProps {
  escrowId: string;
  onSuccess: () => void;
  disabled?: boolean;
}

const ConfirmDeliveryButton: React.FC<ConfirmDeliveryButtonProps> = ({ escrowId, onSuccess, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const api = createApiClient();

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await api.post(`/escrows/${escrowId}/confirm`);
      setSuccess(true);
      setOpen(false);
      onSuccess();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to confirm delivery';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSuccess(false);
    setError(null);
  };

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setOpen(true)}
        disabled={disabled || loading}
      >
        Confirm Delivery
      </Button>

      <Dialog open={open} onClose={() => !loading && setOpen(false)}>
        <DialogTitle>Confirm Delivery</DialogTitle>
        <DialogContent>
          Are you sure you want to confirm delivery for this escrow?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => !loading && setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={loading} color="primary">
            {loading ? <CircularProgress size={24} /> : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={error}
      />
      <Snackbar
        open={success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message="Delivery confirmed successfully"
      />
    </>
  );
};

export default ConfirmDeliveryButton;