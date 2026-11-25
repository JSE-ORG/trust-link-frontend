import { Page } from "@playwright/test";

import { JWT, VENDOR_KEY } from "./constants";

export async function authenticatePage(page: Page, token = JWT) {
  await page.addInitScript((jwt: string) => {
    window.localStorage.setItem("wallet.jwt", jwt);
  }, token);
}

/**
 * Makes the app treat the browser as a returning, connected wallet.
 *
 * A stored JWT alone is not enough: `WalletProvider` restores a session only when it
 * also finds the stored public key and Freighter reports as installed and connected,
 * and it then re-runs the SEP-10 sign-in against the mocked API. Pair this with
 * `mockFreighter(page)`.
 */
export async function restoreWalletSession(page: Page, publicKey = VENDOR_KEY) {
  await page.addInitScript((key: string) => {
    window.localStorage.setItem("wallet.publicKey", key);
  }, publicKey);
}
