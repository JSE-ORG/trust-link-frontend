import { escrowSchema } from './escrow';
import { describe, it, expect } from 'vitest';

describe('escrowSchema', () => {
  describe('itemName', () => {
    it('rejects whitespace-only strings', () => {
      const result = escrowSchema.safeParse({
        itemName: '   ',
        description: 'Valid description',
        priceUSDC: '10.00',
        shippingWindow: 7
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Item name is required and cannot be whitespace');
    });

    it('rejects empty strings', () => {
      const result = escrowSchema.safeParse({
        itemName: '',
        description: 'Valid description',
        priceUSDC: '10.00',
        shippingWindow: 7
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Item name is required and cannot be whitespace');
    });

    it('rejects strings longer than 255 characters', () => {
      const result = escrowSchema.safeParse({
        itemName: 'a'.repeat(256),
        description: 'Valid description',
        priceUSDC: '10.00',
        shippingWindow: 7
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Item name must be 255 characters or less');
    });

    it('accepts valid itemName', () => {
      const result = escrowSchema.safeParse({
        itemName: 'Valid Item',
        description: 'Valid description',
        priceUSDC: '10.00',
        shippingWindow: 7
      });
      expect(result.success).toBe(true);
    });
  });

  describe('description', () => {
    it('rejects whitespace-only strings', () => {
      const result = escrowSchema.safeParse({
        itemName: 'Valid Item',
        description: '   ',
        priceUSDC: '10.00',
        shippingWindow: 7
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Description is required and cannot be whitespace');
    });

    it('rejects strings longer than 255 characters', () => {
      const result = escrowSchema.safeParse({
        itemName: 'Valid Item',
        description: 'a'.repeat(256),
        priceUSDC: '10.00',
        shippingWindow: 7
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Description must be 255 characters or less');
    });

    it('accepts valid description', () => {
      const result = escrowSchema.safeParse({
        itemName: 'Valid Item',
        description: 'Valid description',
        priceUSDC: '10.00',
        shippingWindow: 7
      });
      expect(result.success).toBe(true);
    });
  });

  describe('priceUSDC', () => {
    it('rejects scientific notation', () => {
      const result = escrowSchema.safeParse({
        itemName: 'Valid Item',
        description: 'Valid description',
        priceUSDC: '1e1000',
        shippingWindow: 7
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Price must be a valid number with up to 6 decimal places');
    });

    it('rejects dust amounts (too small)', () => {
      const result = escrowSchema.safeParse({
        itemName: 'Valid Item',
        description: 'Valid description',
        priceUSDC: '0.000000001',
        shippingWindow: 7
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Price must be at least 0.01 USDC');
    });

    it('rejects overflow amounts (too large)', () => {
      const result = escrowSchema.safeParse({
        itemName: 'Valid Item',
        description: 'Valid description',
        priceUSDC: '10000000000',
        shippingWindow: 7
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Price must be 1,000,000,000 USDC or less');
    });

    it('rejects prices with more than 6 decimal places', () => {
      const result = escrowSchema.safeParse({
        itemName: 'Valid Item',
        description: 'Valid description',
        priceUSDC: '10.0000001',
        shippingWindow: 7
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Price must be a valid number with up to 6 decimal places');
    });

    it('rejects prices with leading/trailing whitespace', () => {
      const result = escrowSchema.safeParse({
        itemName: 'Valid Item',
        description: 'Valid description',
        priceUSDC: ' 10 ',
        shippingWindow: 7
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Price must be a valid number with up to 6 decimal places');
    });

    it('accepts valid price with 6 decimals', () => {
      const result = escrowSchema.safeParse({
        itemName: 'Valid Item',
        description: 'Valid description',
        priceUSDC: '10.000001',
        shippingWindow: 7
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid price at lower bound', () => {
      const result = escrowSchema.safeParse({
        itemName: 'Valid Item',
        description: 'Valid description',
        priceUSDC: '0.01',
        shippingWindow: 7
      });
      expect(result.success).toBe(true);
    });

    it('accepts valid price at upper bound', () => {
      const result = escrowSchema.safeParse({
        itemName: 'Valid Item',
        description: 'Valid description',
        priceUSDC: '1000000000',
        shippingWindow: 7
      });
      expect(result.success).toBe(true);
    });
  });

  describe('shippingWindow', () => {
    it('rejects invalid shipping window', () => {
      const result = escrowSchema.safeParse({
        itemName: 'Valid Item',
        description: 'Valid description',
        priceUSDC: '10.00',
        shippingWindow: 100
      });
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe('Shipping window must be one of: 7, 14, 30, 60, 90');
    });

    it('accepts valid shipping window', () => {
      const result = escrowSchema.safeParse({
        itemName: 'Valid Item',
        description: 'Valid description',
        priceUSDC: '10.00',
        shippingWindow: 30
      });
      expect(result.success).toBe(true);
    });
  });
});