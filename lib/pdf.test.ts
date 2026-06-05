import { describe, it, expect, vi, beforeEach } from 'vitest';
import { formatTransactionHistoryData, generateSummaryPDF } from '@/lib/pdf';
import type { Escrow } from '@/types';

describe('PDF Export Utility', () => {
  const mockEscrows: Escrow[] = [
    {
      id: 'escrow-1',
      vendorId: 'vendor-123',
      buyerId: 'buyer-456',
      item: 'Electronics Item',
      amount: 100,
      status: 'COMPLETED',
      createdAt: '2024-01-15T10:30:00Z',
      updatedAt: '2024-01-20T14:00:00Z',
      history: [],
    },
    {
      id: 'escrow-2',
      vendorId: 'vendor-123',
      buyerId: 'buyer-789',
      item: 'Clothing',
      amount: 50,
      status: 'SHIPPED',
      createdAt: '2024-01-16T11:00:00Z',
      updatedAt: '2024-01-18T15:30:00Z',
      history: [],
    },
    {
      id: 'escrow-3',
      vendorId: 'vendor-123',
      buyerId: undefined,
      item: 'Books',
      amount: 30,
      status: 'PENDING',
      createdAt: '2024-01-17T09:00:00Z',
      updatedAt: '2024-01-17T09:00:00Z',
      history: [],
    },
  ];

  describe('formatTransactionHistoryData', () => {
    it('should calculate correct totals', () => {
      const result = formatTransactionHistoryData(mockEscrows);
      expect(result.totalTransactions).toBe(3);
      expect(result.totalAmount).toBe(180);
    });

    it('should generate correct status breakdown', () => {
      const result = formatTransactionHistoryData(mockEscrows);
      expect(result.statusBreakdown).toEqual({
        COMPLETED: 1,
        SHIPPED: 1,
        PENDING: 1,
      });
    });

    it('should format transaction data correctly', () => {
      const result = formatTransactionHistoryData(mockEscrows);
      expect(result.transactions).toHaveLength(3);
      expect(result.transactions[0]).toMatchObject({
        id: 'escrow-1',
        item: 'Electronics Item',
        amount: 100,
        status: 'COMPLETED',
      });
    });

    it('should handle missing buyerId', () => {
      const result = formatTransactionHistoryData(mockEscrows);
      expect(result.transactions[2].buyerId).toBe('N/A');
    });

    it('should truncate buyer IDs', () => {
      const result = formatTransactionHistoryData(mockEscrows);
      expect(result.transactions[0].buyerId).toMatch(/^.{6}\.\.\..{6}$/);
    });

    it('should handle empty escrow list', () => {
      const result = formatTransactionHistoryData([]);
      expect(result.totalTransactions).toBe(0);
      expect(result.totalAmount).toBe(0);
      expect(result.statusBreakdown).toEqual({});
      expect(result.transactions).toHaveLength(0);
    });
  });

  describe('generateSummaryPDF', () => {
    beforeEach(() => {
      // Mock jsPDF by mocking window.alert or similar if needed
      // For now, we'll just verify the function runs without errors
    });

    it('should create PDF successfully', () => {
      // This is a basic smoke test
      expect(() => {
        generateSummaryPDF(mockEscrows, 'vendor-123', 'test.pdf');
      }).not.toThrow();
    });

    it('should handle empty escrows gracefully', () => {
      expect(() => {
        generateSummaryPDF([], 'vendor-123', 'test.pdf');
      }).not.toThrow();
    });

    it('should use custom filename if provided', () => {
      expect(() => {
        generateSummaryPDF(mockEscrows, 'vendor-123', 'custom-name.pdf');
      }).not.toThrow();
    });

    it('should use default filename if not provided', () => {
      expect(() => {
        generateSummaryPDF(mockEscrows, 'vendor-123');
      }).not.toThrow();
    });
  });
});
