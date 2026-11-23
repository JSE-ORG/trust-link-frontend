import { Page } from "@playwright/test";

import { JWT } from "./constants";

export async function authenticatePage(page: Page, token = JWT) {
  await page.addInitScript((jwt: string) => {
    window.localStorage.setItem("wallet.jwt", jwt);
  }, token);
}
