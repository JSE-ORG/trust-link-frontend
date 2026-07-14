import {
  isConnected,
  getAddress,
  signTransaction as freighterSignTransaction,
  isAllowed,
  setAllowed,
} from "@stellar/freighter-api";

/**
 * Checks if the Freighter wallet extension is installed in the browser
 * @returns {Promise<boolean>} True if Freighter is installed, false otherwise
 * @example
 * const installed = await isFreighterInstalled();
 * if (!installed) {
 *   alert("Please install Freighter wallet");
 * }
 */
export async function isFreighterInstalled(): Promise<boolean> {
  return typeof window !== "undefined" && Boolean((window as any).freighter);
}

/**
 * Connects to the Freighter wallet and requests user permission
 * @returns {Promise<string>} The user's Stellar public key
 * @throws {Error} If Freighter is not installed or permission is denied
 * @example
 * try {
 *   const publicKey = await connectFreighter();
 *   console.log("Connected with key:", publicKey);
 * } catch (error) {
 *   console.error("Failed to connect:", error);
 * }
 */
export async function connectFreighter(): Promise<string> {
  if (!(await isFreighterInstalled())) {
    throw new Error("Freighter not installed");
  }

  if (!(await isAllowed())) {
    await setAllowed();
  }

  const { address: publicKey } = await getAddress();
  if (!publicKey) {
    throw new Error("Failed to get public key from Freighter");
  }

  return publicKey;
}

import { captureWalletError } from "@/lib/sentry";

/**
 * Signs a Stellar transaction using the Freighter wallet
 * @param {string} xdr - The transaction XDR string to sign
 * @param {string} network - The network to use ("PUBLIC", "TESTNET", or custom passphrase)
 * @returns {Promise<string>} The signed transaction XDR
 * @throws {Error} If Freighter is not installed, signing fails, or user rejects
 * @example
 * try {
 *   const signedXdr = await signTransaction(transactionXdr, "TESTNET");
 *   // Submit signedXdr to network
 * } catch (error) {
 *   console.error("Transaction signing failed:", error);
 * }
 */
export async function signTransaction(
  xdr: string,
  network: "PUBLIC" | "TESTNET" | string
): Promise<string> {
  try {
    if (!(await isFreighterInstalled())) {
      throw new Error("Freighter not installed");
    }

    const { signedTransaction: signedTxXdr, error } = await (freighterSignTransaction as any)(xdr, { networkPassphrase: network });

    if (error) {
      throw new Error(error);
    }

    if (!signedTxXdr) {
      throw new Error("Failed to sign transaction");
    }

    return signedTxXdr;
  } catch (error: unknown) {
    captureWalletError(
      error instanceof Error ? error : new Error(String(error)),
      { xdr, network, action: "signTransaction" }
    );
    throw error;
  }
}

export { isConnected, getAddress };
