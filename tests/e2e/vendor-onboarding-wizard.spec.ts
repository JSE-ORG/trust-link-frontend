import { expect, test } from "next/experimental/testmode/playwright";

import { setupNetworkMocks } from "./helpers/mock-api";
import { mockFreighter } from "./helpers/mock-freighter";

test("vendor onboarding wizard persists state between reloads", async ({ page, next }) => {
  await setupNetworkMocks(page, next);
  await mockFreighter(page);

  await page.goto("/onboarding");

  await page.getByRole("button", { name: "Connect Wallet", exact: true }).click();
  await expect(page.getByText(/connected/i)).toBeVisible();

  await page.getByLabel("Shop name").fill("Stellar Studio");
  await page.getByLabel("Description").fill("Beautiful handcrafted space-themed prints for collectors.");
  await page.getByLabel("Website").fill("https://stellar.example.com");
  await page.getByLabel("Shipping destinations").fill("Worldwide");

  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page.getByRole("heading", { name: /review your store/i })).toBeVisible();
  await expect(page.getByText(/Stellar Studio/i)).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Shop name")).toHaveValue("Stellar Studio");
  await expect(page.getByLabel("Description")).toHaveValue(
    "Beautiful handcrafted space-themed prints for collectors."
  );
  // The wizard normalises URLs on load (URL.toString adds a trailing slash).
  await expect(page.getByLabel("Website")).toHaveValue("https://stellar.example.com/");
  await expect(page.getByLabel("Shipping destinations")).toHaveValue("Worldwide");
});
