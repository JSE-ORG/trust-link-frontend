import { expect, test } from "@playwright/test";

const escrowId = "escrow-onboarding-1";

test("vendor onboarding wizard persists state between reloads", async ({ page }) => {
  await page.addInitScript(() => {
    window.freighter = {
      connect: async () => ({ publicKey: "GCFM4VENDOR8TESTING1234567890ABCDEF" }),
      signTransaction: async () => ({ signedTransaction: "signed-challenge-xdr" }),
      isConnected: async () => true,
    } as any;
  });

  await page.route("**/stellar/sep10/challenge", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        transaction: "challenge-xdr",
        network_passphrase: "Test SDF Network ; September 2015",
      }),
    });
  });

  await page.route("**/stellar/sep10/token", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ token: "jwt-token" }),
    });
  });

  await page.goto("/onboarding");

  await page.getByRole("button", { name: /connect wallet/i }).click();
  await expect(page.getByText(/connected/i)).toBeVisible();

  await page.getByLabel("Shop name").fill("Stellar Studio");
  await page.getByLabel("Description").fill("Beautiful handcrafted space-themed prints for collectors.");
  await page.getByLabel("Website").fill("https://stellar.example.com");
  await page.getByLabel("Shipping destinations").fill("Worldwide");

  await page.getByRole("button", { name: /next/i }).click();
  await expect(page.getByText(/review your store/i)).toBeVisible();
  await expect(page.getByText(/Stellar Studio/i)).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Shop name")).toHaveValue("Stellar Studio");
  await expect(page.getByLabel("Description")).toHaveValue(
    "Beautiful handcrafted space-themed prints for collectors."
  );
  await expect(page.getByLabel("Website")).toHaveValue("https://stellar.example.com");
  await expect(page.getByLabel("Shipping destinations")).toHaveValue("Worldwide");
});
