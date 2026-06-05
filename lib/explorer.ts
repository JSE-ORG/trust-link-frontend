export function getStellarExpertUrl(address: string, network?: string): string {
  const net = network || process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet";

  if (net.toLowerCase() === "mainnet" || net.toLowerCase() === "public") {
    return `https://stellar.expert/explorer/public/contract/${address}`;
  }

  return `https://stellar.expert/explorer/testnet/contract/${address}`;
}

export function getStellarExpertTxUrl(txHash: string, network?: string): string {
  const net = network || process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet";
  const isMainnet = net.toLowerCase() === "mainnet" || net.toLowerCase() === "public";
  return isMainnet
    ? `https://stellar.expert/explorer/public/tx/${txHash}`
    : `https://stellar.expert/explorer/testnet/tx/${txHash}`;
}
