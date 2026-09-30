import { Networks, Transaction, TransactionBuilder, BASE_FEE, Operation, Keypair, StrKey, xdr } from 'stellar-sdk';
import { captureWalletError } from '../sentry';
import { isFeatureEnabled } from '../config';

// Correct availability check using Freighter API methods
export const isFreighterAvailable = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  const freighter = (window as any).freighter;
  if (!freighter) return false;
  try {
    return await freighter.isConnected() || await freighter.isAllowed();
  } catch {
    return false;
  }
};

export const getFreighterPublicKey = async (): Promise<string | null> => {
  if (!(await isFreighterAvailable())) return null;
  try {
    const publicKey = await (window as any).freighter.getPublicKey();
    if (!StrKey.isValidEd25519PublicKey(publicKey)) {
      throw new Error('Invalid public key from Freighter');
    }
    return publicKey;
  } catch (error) {
    captureWalletError(error, { context: 'freighter.getPublicKey' });
    return null;
  }
};

export const signTransaction = async (
  transaction: Transaction,
  networkPassphrase: string
): Promise<Transaction> => {
  if (!(await isFreighterAvailable())) {
    throw new Error('Freighter not available');
  }

  // Validate network passphrase
  const validPassphrases = {
    [Networks.PUBLIC]: true,
    [Networks.TESTNET]: true,
  };
  if (!validPassphrases[networkPassphrase as keyof typeof validPassphrases]) {
    throw new Error(`Invalid network passphrase: ${networkPassphrase}`);
  }

  try {
    const signedXdr = await (window as any).freighter.signTransaction(
      transaction.toXDR(),
      {
        networkPassphrase,
      }
    );

    // Redact XDR from logs - never log full XDR in production
    if (isFeatureEnabled('debugStellar')) {
      console.debug('Transaction signed (XDR redacted)');
    }

    return TransactionBuilder.fromXDR(signedXdr, networkPassphrase);
  } catch (error) {
    // Redact XDR from error reporting
    const redactedError = new Error(error.message);
    redactedError.stack = error.stack?.replace(/(xdr=[^&]+)/gi, 'xdr=[REDACTED]');
    captureWalletError(redactedError, {
      context: 'freighter.signTransaction',
      networkPassphrase,
    });
    throw redactedError;
  }
};

export const submitTransaction = async (
  transaction: Transaction,
  networkPassphrase: string
): Promise<string> => {
  const signedTx = await signTransaction(transaction, networkPassphrase);
  try {
    const response = await (window as any).freighter.submitTransaction(
      signedTx.toXDR(),
      { networkPassphrase }
    );
    return response.hash;
  } catch (error) {
    captureWalletError(error, {
      context: 'freighter.submitTransaction',
      networkPassphrase,
    });
    throw error;
  }
};