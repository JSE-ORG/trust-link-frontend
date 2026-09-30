import { Page } from "@playwright/test";

import { NETWORK_PASSPHRASE,VENDOR_KEY } from "./constants";

export interface MockFreighterOptions {
  /**
   * Simulate the user pressing "Reject" in the Freighter signing dialog.
   * When true, `SUBMIT_TRANSACTION` responds with an `apiError` instead of a
   * signed XDR — exactly what `@stellar/freighter-api` surfaces when the
   * extension popup is dismissed or declined.
   */
  rejectSignature?: boolean;
}

export async function mockFreighter(
  page: Page,
  publicKey = VENDOR_KEY,
  signedTransaction = "signed-challenge-xdr",
  options: MockFreighterOptions = {},
) {
  await page.addInitScript(
    ({ pubKey, signedTx, rejectSignature }) => {
      (window as unknown as Record<string, unknown>).freighter = 'mocked';

      (window as unknown as Record<string, unknown>).freighterApi = {
        getPublicKey: async () => pubKey,
        signTransaction: async () => {
          if (rejectSignature) {
            throw new Error("User declined access");
          }
          return { signedTxXdr: signedTx, signerAddress: pubKey };
        },
        isConnected: async () => true,
        isAllowed: async () => true,
        setAllowed: async () => true,
        getNetwork: async () => ({ network: "TESTNET", networkUrl: "", networkPassphrase: "Test SDF Network ; September 2015" }),
      };

      window.addEventListener('message', (e: MessageEvent) => {
        if (e.source !== window || !e.data) return;
        if (e.data.source !== 'FREIGHTER_EXTERNAL_MSG_REQUEST') return;

        const type = e.data.type as string | undefined;
        const reqId = e.data.messageId as string | undefined;

        const respond = (data: Record<string, unknown>) => {
          if (!reqId) return;
          window.postMessage({
            source: 'FREIGHTER_EXTERNAL_MSG_RESPONSE',
            messagedId: reqId,
            ...data
          }, window.location.origin);
        };

        if (type === 'REQUEST_CONNECTION_STATUS') respond({ isConnected: true });
        if (type === 'REQUEST_PUBLIC_KEY') respond({ publicKey: pubKey });
        if (type === 'REQUEST_NETWORK_DETAILS') respond({ networkDetails: { network: "TESTNET", networkUrl: "", networkPassphrase: NETWORK_PASSPHRASE } });
        if (type === 'REQUEST_ALLOWED_STATUS') respond({ isAllowed: true });
        if (type === 'SET_ALLOWED_STATUS') respond({ isAllowed: true });
        if (type === 'REQUEST_ACCESS') respond({ publicKey: pubKey, isAllowed: true });
        if (type === 'SUBMIT_TRANSACTION') {
          if (rejectSignature) {
            // Shape mirrors a real Freighter rejection: `apiError` is set and
            // no signed transaction is returned.
            respond({ signedTransaction: "", signerAddress: "", apiError: { code: -4, message: "User declined access" } });
          } else {
            respond({ signedTransaction: signedTx, signerAddress: pubKey, error: "" });
          }
        }
        if (type === 'SUBMIT_TOKEN') respond({ contractId: "", error: "" });
      });
    },
    { pubKey: publicKey, signedTx: signedTransaction, rejectSignature: Boolean(options.rejectSignature) }
  );
}
