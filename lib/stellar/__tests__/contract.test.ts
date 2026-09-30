import {
  isValidContractId,
  submitPayment,
  pollTransaction,
  waitForTransaction,
} from '../contract';
import { Networks, Keypair } from 'stellar-sdk';
import { isFeatureEnabled } from '../../config';

// Mock config
jest.mock('../../config', () => ({
  isFeatureEnabled: jest.fn(),
}));

describe('Contract Wrapper', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isValidContractId', () => {
    it('rejects single-letter input like "C"', () => {
      expect(isValidContractId('C')).toBe(false);
    });

    it('rejects short invalid inputs', () => {
      expect(isValidContractId('AB')).toBe(false);
      expect(isValidContractId('G')).toBe(false);
    });

    it('accepts valid Stellar addresses', () => {
      expect(
        isValidContractId('GCTRCN2H6EVVRQH4MKHVWMTY2SPC4ZTRHQZQOSKF5PXFRA4TNDGGF4VL')
      ).toBe(true);
      expect(
        isValidContractId('CCZSC4MDBX6X63UKXC32CA3V6W5JZXPJC4QA7JQVY73NHY46L7YTQ5J2')
      ).toBe(true);
    });

    it('rejects invalid Stellar addresses', () => {
      expect(isValidContractId('INVALID_ADDRESS')).toBe(false);
      expect(isValidContractId('GCTRCN2H6EVVRQH4MKHVWMTY2SPC4ZTRHQZQOSKF5PXFRA4')).toBe(
        false
      );
    });
  });

  describe('submitPayment', () => {
    const mockKeypair = Keypair.fromSecret(
      'SCZANGBA5YHTNYVVV4C3U252E2B6P6F5T3U6MM63WBSBZATAQI3EBTQ4'
    );

    it('returns mock hash when feature flag is enabled', async () => {
      (isFeatureEnabled as jest.Mock).mockReturnValue(true);
      const hash = await submitPayment(
        'GCTRCN2H6EVVRQH4MKHVWMTY2SPC4ZTRHQZQOSKF5PXFRA4TNDGGF4VL',
        '100',
        'XLM',
        Networks.TESTNET
      );
      expect(hash).toMatch(/^MOCK_HASH_/);
    });

    it('throws when destination is empty in mock mode', async () => {
      (isFeatureEnabled as jest.Mock).mockReturnValue(true);
      await expect(
        submitPayment('', '100', 'XLM', Networks.TESTNET)
      ).rejects.toThrow('Destination is required');
    });

    it('throws for invalid destination address', async () => {
      (isFeatureEnabled as jest.Mock).mockReturnValue(false);
      await expect(
        submitPayment('INVALID', '100', 'XLM', Networks.TESTNET)
      ).rejects.toThrow('Invalid destination address');
    });
  });

  describe('pollTransaction', () => {
    const mockHash = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6';

    it('returns transaction when found', async () => {
      const mockResponse = { hash: mockHash, ledger: 123 };
      const mockServer = {
        transactions: () => ({
          transaction: () => ({
            call: jest.fn().mockResolvedValue(mockResponse),
          }),
        }),
      };

      jest.spyOn(require('stellar-sdk'), 'Horizon').mockImplementation(
        () => mockServer
      );

      const result = await pollTransaction(mockHash, Networks.TESTNET);
      expect(result).toEqual(mockResponse);
    });

    it('throws after max attempts when transaction not found', async () => {
      const mockServer = {
        transactions: () => ({
          transaction: () => ({
            call: jest.fn().mockRejectedValue({ response: { status: 404 } }),
          }),
        }),
      };

      jest.spyOn(require('stellar-sdk'), 'Horizon').mockImplementation(
        () => mockServer
      );

      await expect(
        pollTransaction(mockHash, Networks.TESTNET, 2)
      ).rejects.toThrow('Transaction not found after 2 attempts');
    });

    it('preserves hash in error message on timeout', async () => {
      const mockServer = {
        transactions: () => ({
          transaction: () => ({
            call: jest.fn().mockRejectedValue({ response: { status: 404 } }),
          }),
        }),
      };

      jest.spyOn(require('stellar-sdk'), 'Horizon').mockImplementation(
        () => mockServer
      );

      await expect(
        pollTransaction(mockHash, Networks.TESTNET, 1)
      ).rejects.toThrow(`Transaction not found after 1 attempts: ${mockHash}`);
    });
  });
});