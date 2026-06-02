"use client";

export default function TestnetBanner() {
  const network = process.env.NEXT_PUBLIC_STELLAR_NETWORK || "testnet";
  const isTestnet = network.toLowerCase() === "testnet";

  if (!isTestnet) return null;

  return (
    <div 
      className="bg-yellow-100 px-4 py-2 text-center text-xs font-medium text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 border-b border-yellow-200 dark:border-yellow-800"
      role="alert"
    >
      You are on Testnet — funds have no real value
    </div>
  );
}
