import { Networks, Transaction, TransactionBuilder, BASE_FEE, Operation, Keypair, StrKey, xdr, Horizon } from 'stellar-sdk';
import { captureWalletError } from '../sentry';
import { isFeatureEnabled } from '../config';

export const isValidContractId = (contractId: string): boolean => {
  // Must be a valid Stellar address (G... or C... for contracts)
  // Reject single-letter inputs like "C"
  if (contractId.length < 3) return false;
  return StrKey.isValidEd25519PublicKey(contractId) || StrKey.isValidContractAddress(contractId);
};

export const submitPayment = async (
  destination: string,
  amount: string,
  asset: string,
  networkPassphrase: string,
  sourceKeypair?: Keypair
): Promise<string> => {
  if (isFeatureEnabled('mockPayments')) {
    // Feature-flagged mock for testing only
    if (!destination) throw new Error('Destination is required');
    return 'MOCK_HASH_' + Math.random().toString(36).substring(2, 10);
  }

  if (!isValidContractId(destination)) {
    throw new Error(`Invalid destination address: ${destination}`);
  }

  const server = new Horizon.Server(
    networkPassphrase === Networks.PUBLIC
      ? 'https://horizon.stellar.org'
      : 'https://horizon-testnet.stellar.org'
  );

  const account = sourceKeypair
    ? await server.loadAccount(sourceKeypair.publicKey())
    : await server.loadAccount(destination);

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination,
        asset,
        amount,
      })
    )
    .setTimeout(30)
    .build();

  transaction.sign(sourceKeypair || Keypair.fromSecret('...'));

  const response = await server.submitTransaction(transaction);
  return response.hash;
};

export const pollTransaction = async (
  hash: string,
  networkPassphrase: string,
  maxAttempts: number = 10
): Promise<Horizon.TransactionResponse> => {
  const server = new Horizon.Server(
    networkPassphrase === Networks.PUBLIC
      ? 'https://horizon.stellar.org'
      : 'https://horizon-testnet.stellar.org'
  );

  let attempts = 0;
  let delay = 1000; // Initial delay in ms

  while (attempts < maxAttempts) {
    try {
      const response = await server.transactions().transaction(hash).call();
      return response;
    } catch (error) {
      if ((error as any).response?.status === 404) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw new Error(`Transaction not found after ${maxAttempts} attempts: ${hash}`);
        }
        // Exponential backoff with jitter
        const jitter = Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay + jitter));
        delay = Math.min(delay * 2, 10000); // Cap at 10 seconds
      } else {
        throw error;
      }
    }
  }

  throw new Error(`Polling failed for transaction: ${hash}`);
};

export const waitForTransaction = async (
  hash: string,
  networkPassphrase: string
): Promise<Horizon.TransactionResponse> => {
  try {
    return await pollTransaction(hash, networkPassphrase);
  } catch (error) {
    captureWalletError(error, {
      context: 'contract.waitForTransaction',
      hash: hash.substring(0, 8) + '...', // Partially redact hash in logs
      networkPassphrase,
    });
    throw error;
  }
};