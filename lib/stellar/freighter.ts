declare global {
  interface Window {
    freighter?: {
      connect: () => Promise<{ publicKey: string }>;
      signTransaction: (transaction: string, networkPassphrase: string) => Promise<{ signedTransaction: string }>;
    };
  }
}

export interface FreighterConnection {
  publicKey: string;
}

export async function isFreighterInstalled(): Promise<boolean> {
  return typeof window !== "undefined" && Boolean(window.freighter);
}

export async function connectFreighter(): Promise<FreighterConnection> {
  if (!window.freighter) {
    throw new Error("Freighter not installed");
  }

  return window.freighter.connect();
}

export async function signTransaction(
  transaction: string,
  networkPassphrase: string
): Promise<string> {
  if (!window.freighter) {
    throw new Error("Freighter not installed");
  }

  const result = await window.freighter.signTransaction(transaction, networkPassphrase);
  return result.signedTransaction;
}
