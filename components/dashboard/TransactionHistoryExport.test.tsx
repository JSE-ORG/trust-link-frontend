import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TransactionHistoryExport from '@/components/dashboard/TransactionHistoryExport';
import * as pdfLib from '@/lib/pdf';
import type { Escrow } from '@/types';

// Mock the PDF library
vi.mock('@/lib/pdf', () => ({
  generateSummaryPDF: vi.fn(),
}));

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('TransactionHistoryExport Component', () => {
  const mockEscrows: Escrow[] = [
    {
      id: 'escrow-1',
      vendorId: 'vendor-123',
      buyerId: 'buyer-456',
      item: 'Test Item',
      amount: 100,
      status: 'COMPLETED',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-20T14:00:00Z',
      history: [],
    },
  ];

  it('renders export button', () => {
    render(
      <TransactionHistoryExport
        escrows={mockEscrows}
        vendorId="vendor-123"
      />
    );
    expect(screen.getByRole('button', { name: /Export PDF/i })).toBeInTheDocument();
  });

  it('disables button when no escrows', () => {
    render(
      <TransactionHistoryExport
        escrows={[]}
        vendorId="vendor-123"
      />
    );
    expect(screen.getByRole('button', { name: /Export PDF/i })).toBeDisabled();
  });

  it('calls generateSummaryPDF on click', async () => {
    render(
      <TransactionHistoryExport
        escrows={mockEscrows}
        vendorId="vendor-123"
      />
    );
    
    fireEvent.click(screen.getByRole('button', { name: /Export PDF/i }));
    
    await waitFor(() => {
      expect(pdfLib.generateSummaryPDF).toHaveBeenCalledWith(
        mockEscrows,
        'vendor-123',
        expect.stringContaining('trustlink-transactions-')
      );
    });
  });

  it('shows loading state during export', async () => {
    render(
      <TransactionHistoryExport
        escrows={mockEscrows}
        vendorId="vendor-123"
      />
    );
    
    const button = screen.getByRole('button', { name: /Export PDF/i });
    fireEvent.click(button);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Exporting/i })).toBeInTheDocument();
    });
  });
});
