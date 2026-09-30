/**
 * Freighter wallet adapter.
 *
 * Every wallet interaction in the app goes through this module so the
 * `@stellar/freighter-api` response shapes stay in one place. Two shapes matter
 * and are easy to get wrong:
 *
 *   - `isConnected()` resolves to `{ isConnected }`, not to a boolean. Awaiting
 *     it and testing the result is always truthy.
 *   - `signTransaction()` takes a *network passphrase*
 *     ("Test SDF Network ; September 2015"), not a network name ("TESTNET").
 *     `resolveNetworkPassphrase` maps the names the app uses onto passphrases.
 */
import {
  getAddress,
  isAllowed,
  isConnected,
  setAllowed,
  signTransaction as freighterSignTransaction,
} from "@stellar/freighter-api";
import { Networks } from "@stellar/stellar-sdk";

import { captureWalletError } from "@/lib/logger";

import { isValidNetworkPassphrase, resolveNetworkPassphrase } from "./networks";

export { isValidNetworkPassphrase, resolveNetworkPassphrase };

/**
 * Reports whether the Freighter API is reachable, i.e. the extension is
 * installed and the page can talk to it. Freighter's own `isConnected()` is the
 * source of truth — sniffing `window.freighter` only proves some object exists
 * on the page, which is also true for mocks and for the external API shim when
 * no extension is running.
 *
 * @returns {Promise<boolean>} True when the wallet can be reached, false otherwise
 * @example
 * const installed = await isFreighterInstalled();
 * if (!installed) {
 *   alert("Please install Freighter wallet");
 * }
 */
export async function isFreighterInstalled(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  
  try {
    return await isConnected();
  } catch {
    return false;
  }
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

  const { isAllowed: allowed } = await isAllowed();
  if (!allowed) {
    await setAllowed();
  }

  const { address: publicKey } = await getAddress();
  if (!publicKey) {
    throw new Error("Failed to get public key from Freighter");
  }

  return publicKey;
}

/**
 * Signs a Stellar transaction using the Freighter wallet
 * @param {string} xdr - The transaction XDR string to sign
 * @param {string} network - Network name ("PUBLIC"/"mainnet", "TESTNET"/"testnet")
 *   or a full network passphrase. Names are mapped to the matching
 *   `Networks.*` passphrase before the call.
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
  // Resolve before the try block so a bad network argument surfaces as its own
  // error rather than being reported as a Freighter failure.
  const networkPassphrase = resolveNetworkPassphrase(network);

  try {
    if (!(await isFreighterInstalled())) {
      throw new Error("Freighter not installed");
    }

    const networkPassphrase = network === "PUBLIC" 
      ? Networks.PUBLIC 
      : network === "TESTNET" 
        ? Networks.TESTNET 
        : network;

    const response = (await freighterSignTransaction(xdr, {
      networkPassphrase,
    })) as {
      signedTxXdr?: string;
      signerAddress?: string;
    };

    const signedTxXdr = response?.signedTxXdr;

    if (!signedTxXdr) {
      throw new Error("Failed to sign transaction");
    }

    return signedTxXdr;
  } catch (error: unknown) {
    captureWalletError(error, { network, action: "signTransaction" });
    throw error;
  }
}

export { getAddress,isConnected };
