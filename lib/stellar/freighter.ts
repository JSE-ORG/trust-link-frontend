import {
  isConnected,
  getPublicKey,
  signTransaction as freighterSignTransaction,
  isAllowed,
  setAllowed,
} from "@stellar/freighter-api";

export async function isFreighterInstalled(): Promise<boolean> {
  return typeof window !== "undefined" && Boolean((window as any).freighter);
}

export async function connectFreighter(): Promise<string> {
  if (!(await isFreighterInstalled())) {
    throw new Error("Freighter not installed");
  }

  if (!(await isAllowed())) {
    await setAllowed();
  }

  const publicKey = await getPublicKey();
  if (!publicKey) {
    throw new Error("Failed to get public key from Freighter");
  }

  return publicKey;
}

export async function signTransaction(
  xdr: string,
  network: "PUBLIC" | "TESTNET" | string
): Promise<string> {
  if (!(await isFreighterInstalled())) {
    throw new Error("Freighter not installed");
  }

  // Freighter's signTransaction takes (xdr, { network })
  const { signedTransaction, error } = await freighterSignTransaction({
    xdr,
    network,
  });

  if (error) {
    throw new Error(error);
  }

  if (!signedTransaction) {
    throw new Error("Failed to sign transaction");
  }

  return signedTransaction;
}

export { isConnected, getPublicKey };
