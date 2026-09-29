import { expect, test } from "next/experimental/testmode/playwright";

import { setupNetworkMocks } from "./helpers/mock-api";
import { mockFreighter } from "./helpers/mock-freighter";

test("vendor can connect Freighter, create an escrow link, and see the QR code", async ({ page, next }) => {
  await setupNetworkMocks(page, next);
  await mockFreighter(page);

  await page.goto("/create");

  await page.getByRole("button", { name: /connect wallet/i }).click();
  await expect(page.getByRole("button", { name: /GCFM4.*CDEF/i })).toBeVisible();

  await page.getByLabel("Item name").fill("Vintage Camera");
  await page.getByLabel("Price (USDC)").fill("249.99");
  await page.getByLabel("Description").fill("Collector-grade camera in working condition");
  await page.getByLabel("Shipping window").selectOption("1 week");

  await page.getByRole("button", { name: /create escrow link/i }).click();

  const shareableUrl = page.getByTestId("shareable-url");
  await expect(page.getByTestId("link-card")).toBeVisible();
  await expect(shareableUrl).toHaveValue(/^https:\/\/trustlink\.example\.com\/escrow\/Vintage%20Camera$/);
  await expect(page.getByTestId("qr-code")).toBeVisible();
});
