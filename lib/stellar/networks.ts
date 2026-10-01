/**
 * Network name → network passphrase resolution.
 *
 * Stellar signs every transaction with a *network passphrase*
 * ("Test SDF Network ; September 2015"), never with a network name
 * ("TESTNET"). The app speaks network names in its UI, hooks and route
 * handlers, so the translation lives here and both the Freighter adapter and
 * the contract helpers use it. Keeping it in its own module avoids the
 * contract helpers depending on the Freighter adapter.
 */
import { Networks } from "@stellar/stellar-sdk";

/** Network names used across the app, plus the aliases the UI may produce. */
const NETWORK_PASSPHRASE_BY_NAME: Record<string, string> = {
  PUBLIC: Networks.PUBLIC,
  MAINNET: Networks.PUBLIC,
  TESTNET: Networks.TESTNET,
  FUTURENET: Networks.FUTURENET,
  SANDBOX: Networks.SANDBOX,
  STANDALONE: Networks.STANDALONE,
};

/** Every passphrase the SDK knows about, used to detect already-resolved values. */
const KNOWN_PASSPHRASES = new Set<string>(Object.values(Networks));

/**
 * Resolves a network name to the passphrase the network expects.
 *
 * `"PUBLIC"`, `"mainnet"` and `"TESTNET"` map to the matching `Networks.*`
 * passphrase. A value that is already a real passphrase (a futurenet or sandbox
 * network configured by the deployment) is returned untouched, so custom
 * networks keep working.
 *
 * @throws {Error} If the value is empty.
 */
export function resolveNetworkPassphrase(network: string): string {
  if (typeof network !== "string" || network.trim() === "") {
    throw new Error("Network passphrase is required");
  }

  const value = network.trim();
  return NETWORK_PASSPHRASE_BY_NAME[value.toUpperCase()] ?? value;
}

/** Non-throwing variant, for callers that only need to detect a valid value. */
export function isValidNetworkPassphrase(network: string): boolean {
  try {
    resolveNetworkPassphrase(network);
    return true;
  } catch {
    return false;
  }
}

/** True when the value is a real passphrase rather than a network name. */
export function isNetworkPassphrase(value: string): boolean {
  return KNOWN_PASSPHRASES.has(value);
}

/** Passphrase for the two networks the contract helpers support. */
export function getNetworkPassphrase(
  network: "TESTNET" | "PUBLIC"
): typeof Networks.PUBLIC | typeof Networks.TESTNET {
  return network === "PUBLIC" ? Networks.PUBLIC : Networks.TESTNET;
}
