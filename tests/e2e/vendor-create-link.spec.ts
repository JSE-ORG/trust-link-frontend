import { expect, test } from "next/experimental/testmode/playwright";

import { setupNetworkMocks } from "./helpers/mock-api";
import { mockFreighter } from "./helpers/mock-freighter";

test("vendor can connect Freighter, create an escrow link, and see the QR code", async ({ page, next }) => {
  await setupNetworkMocks(page, next);
  await mockFreighter(page);

  await page.goto("/create");

  // The navbar has its own wallet button, so scope to the page body (<main>) to hit the one
  // under test.
  const main = page.getByRole("main");
  await main.getByRole("button", { name: /connect wallet/i }).click();
  await expect(main.getByRole("button", { name: /GCFM.*CDEF/i })).toBeVisible();

  await page.getByLabel("Item name").fill("Vintage Camera");
  await page.getByLabel("Price (USDC)").fill("249.99");
  await page.getByLabel("Description").fill("Collector-grade camera in working condition");
  await page.getByLabel("Shipping window").selectOption("1 week");

  await page.getByRole("button", { name: /create escrow link/i }).click();

  const shareableUrl = page.getByTestId("shareable-url");
  await expect(page.getByTestId("link-card")).toBeVisible();
  await expect(shareableUrl).toHaveValue(/^https:\/\/trustlink\.example\.com\/escrow\/Vintage%20Camera$/);
  // The share dialog renders its own QR code, so look inside the link card.
  await expect(page.getByTestId("link-card").getByTestId("qr-code")).toBeVisible();
});
