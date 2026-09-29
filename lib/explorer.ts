/**
 * Generates the Stellar Expert block explorer URL for a given contract address.
 *
 * @param address - The Stellar contract public address.
 * @param network - Optional network name ("mainnet", "public", or "testnet"). Defaults to env or "testnet".
 * @returns The explorer URL for viewing the contract.
 */
export function getStellarExpertUrl(address: string, network?: string): string {
  const net = network || process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet";

  if (net.toLowerCase() === "mainnet" || net.toLowerCase() === "public") {
    return `https://stellar.expert/explorer/public/contract/${address}`;
  }

  return `https://stellar.expert/explorer/testnet/contract/${address}`;
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
