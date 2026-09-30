import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConfirmDeliveryButton from './ConfirmDeliveryButton';
import { createApiClient } from '../../lib/api-client';

jest.mock('../../lib/api-client');

describe('ConfirmDeliveryButton', () => {
  const mockOnSuccess = jest.fn();
  const mockPost = jest.fn();
  const escrowId = '123';

  beforeEach(() => {
    jest.clearAllMocks();
    (createApiClient as jest.Mock).mockReturnValue({
      post: mockPost,
    });
  });

  it('calls onSuccess and shows success toast when confirmation succeeds', async () => {
    mockPost.mockResolvedValue({});
    render(<ConfirmDeliveryButton escrowId={escrowId} onSuccess={mockOnSuccess} />);

    fireEvent.click(screen.getByText('Confirm Delivery'));
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(`/escrows/${escrowId}/confirm`);
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(screen.getByText('Delivery confirmed successfully')).toBeInTheDocument();
    });
  });

  it('shows error toast when confirmation fails', async () => {
    const errorMessage = 'Server error';
    mockPost.mockRejectedValue(new Error(errorMessage));
    render(<ConfirmDeliveryButton escrowId={escrowId} onSuccess={mockOnSuccess} />);

    fireEvent.click(screen.getByText('Confirm Delivery'));
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith(`/escrows/${escrowId}/confirm`);
      expect(mockOnSuccess).not.toHaveBeenCalled();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('disables buttons while loading', async () => {
    mockPost.mockImplementation(() => new Promise(() => {}));
    render(<ConfirmDeliveryButton escrowId={escrowId} onSuccess={mockOnSuccess} />);

    fireEvent.click(screen.getByText('Confirm Delivery'));
    fireEvent.click(screen.getByText('Confirm'));

    await waitFor(() => {
      expect(screen.getByText('Confirm Delivery')).toBeDisabled();
      expect(screen.getByText('Cancel')).toBeDisabled();
      expect(screen.getByText('Confirm')).toBeDisabled();
    });
  });
});