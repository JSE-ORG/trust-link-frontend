export function getStellarExpertUrl(address: string, network?: string): string {
  const net = network || process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet";

  if (net.toLowerCase() === "mainnet" || net.toLowerCase() === "public") {
    return `https://stellar.expert/explorer/public/contract/${address}`;
  }

  return `https://stellar.expert/explorer/testnet/contract/${address}`;
}
