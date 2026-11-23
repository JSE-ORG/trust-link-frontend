/**
 * Generates the Stellar Expert block explorer URL for a given contract address.
 *
 * @param address - The Stellar contract public address.
 * @param network - Optional network name ("mainnet", "public", or "testnet"). Defaults to env or "testnet".
 * @param type - The entity type ("contract" or "account"). Defaults to "contract".
 * @returns The explorer URL for viewing the entity.
 */
export function getStellarExpertUrl(
  address: string,
  network?: string,
  type: "contract" | "account" = "contract"
): string {
  const net = network || process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet";
  const isMainnet = net.toLowerCase() === "mainnet" || net.toLowerCase() === "public";
  const path = isMainnet ? "public" : "testnet";
  return `https://stellar.expert/explorer/${path}/${type}/${address}`;
}

/**
 * Generates the Stellar Expert block explorer URL for an account public key.
 *
 * @param account - The Stellar account public key.
 * @param network - Optional network name ("mainnet", "public", or "testnet"). Defaults to env or "testnet".
 * @returns The explorer URL for viewing account details.
 */
export function getStellarExpertAccountUrl(account: string, network?: string): string {
  return getStellarExpertUrl(account, network, "account");
}

/**
 * Generates the Stellar Expert block explorer URL for a transaction hash.
 *
 * @param txHash - The transaction hash.
 * @param network - Optional network name ("mainnet", "public", or "testnet"). Defaults to env or "testnet".
 * @returns The explorer URL for viewing transaction details.
 */
export function getStellarExpertTxUrl(txHash: string, network?: string): string {
  const net = network || process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet";
  const isMainnet = net.toLowerCase() === "mainnet" || net.toLowerCase() === "public";
  return isMainnet
    ? `https://stellar.expert/explorer/public/tx/${txHash}`
    : `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}
