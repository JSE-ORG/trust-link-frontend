import { Page } from "@playwright/test";

export async function authenticatePage(page: Page, token = "jwt-token") {
  await page.addInitScript((jwt: string) => {
    window.localStorage.setItem("wallet.jwt", jwt);
  }, token);
}
