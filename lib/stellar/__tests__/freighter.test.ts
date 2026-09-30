import { isFreighterAvailable, getFreighterPublicKey, signTransaction, submitTransaction } from '../freighter';
import { Networks, TransactionBuilder, BASE_FEE, Operation, Keypair } from 'stellar-sdk';

// Mock window.freighter
declare global {
  interface Window {
    freighter: any;
  }
}

describe('Freighter Wrapper', () => {
  beforeEach(() => {
    global.window = {
      freighter: {
        isConnected: jest.fn().mockResolvedValue(false),
        isAllowed: jest.fn().mockResolvedValue(false),
        getPublicKey: jest.fn(),
        signTransaction: jest.fn(),
        submitTransaction: jest.fn(),
      },
    } as any;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('isFreighterAvailable', () => {
    it('returns false when freighter is not available', async () => {
      global.window.freighter = undefined;
      const result = await isFreighterAvailable();
      expect(result).toBe(false);
    });

    it('returns true when isConnected returns true', async () => {
      global.window.freighter.isConnected.mockResolvedValue(true);
      const result = await isFreighterAvailable();
      expect(result).toBe(true);
    });

    it('returns true when isAllowed returns true', async () => {
      global.window.freighter.isAllowed.mockResolvedValue(true);
      const result = await isFreighterAvailable();
      expect(result).toBe(true);
    });
  });

  describe('getFreighterPublicKey', () => {
    it('returns null when freighter is not available', async () => {
      global.window.freighter = undefined;
      const result = await getFreighterPublicKey();
      expect(result).toBeNull();
    });

    it('returns public key when valid', async () => {
      const validPublicKey = 'GCTRCN2H6EVVRQH4MKHVWMTY2SPC4ZTRHQZQOSKF5PXFRA4TNDGGF4VL';
      global.window.freighter.getPublicKey.mockResolvedValue(validPublicKey);
      global.window.freighter.isConnected.mockResolvedValue(true);
      const result = await getFreighterPublicKey();
      expect(result).toBe(validPublicKey);
    });

    it('returns null for invalid public key', async () => {
      global.window.freighter.getPublicKey.mockResolvedValue('INVALID');
      global.window.freighter.isConnected.mockResolvedValue(true);
      const result = await getFreighterPublicKey();
      expect(result).toBeNull();
    });
  });

  describe('signTransaction', () => {
    it('throws when freighter is not available', async () => {
      global.window.freighter = undefined;
      const transaction = TransactionBuilder.fromXDR(
        'AAAAAgAAAABElb1PqMW5XRXMhHhLEMfpWLkpAtyL8RvYglRrJ',
        Networks.TESTNET
      );
      await expect(signTransaction(transaction, Networks.TESTNET)).rejects.toThrow(
        'Freighter not available'
      );
    });

    it('throws for invalid network passphrase', async () => {
      global.window.freighter.isConnected.mockResolvedValue(true);
      const transaction = TransactionBuilder.fromXDR(
        'AAAAAgAAAABElb1PqMW5XRXMhHhLEMfpWLkpAtyL8RvYglRrJ',
        Networks.TESTNET
      );
      await expect(signTransaction(transaction, 'INVALID')).rejects.toThrow(
        'Invalid network passphrase'
      );
    });

    it('accepts valid network passphrases', async () => {
      global.window.freighter.isConnected.mockResolvedValue(true);
      global.window.freighter.signTransaction.mockResolvedValue(
        'AAAAAgAAAABElb1PqMW5XRXMhHhLEMfpWLkpAtyL8RvYglRrJ'
      );
      const transaction = TransactionBuilder.fromXDR(
        'AAAAAgAAAABElb1PqMW5XRXMhHhLEMfpWLkpAtyL8RvYglRrJ',
        Networks.TESTNET
      );
      await expect(
        signTransaction(transaction, Networks.TESTNET)
      ).resolves.not.toThrow();
      await expect(
        signTransaction(transaction, Networks.PUBLIC)
      ).resolves.not.toThrow();
    });
  });
});