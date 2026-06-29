import { expect, test } from "@playwright/test";

test("vendor can connect Freighter, create an escrow link, and see the QR code", async ({ page }) => {
  await page.addInitScript(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).freighter = {
      connect: async () => ({ publicKey: "GCFM4VENDOR8TESTING1234567890ABCDEF" }),
      signTransaction: async () => ({ signedTransaction: "signed-challenge-xdr" }),
      isConnected: async () => true,
    };
  });

  await page.route("**/stellar/sep10/challenge**", async (route) => {
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

  await page.route("**/escrow", async (route) => {
    const request = route.request();
    const payload = JSON.parse(request.postData() || "{}") as { itemName?: string };

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        url: `https://trustlink.example.com/escrow/${encodeURIComponent(payload.itemName || "ESCROW-12345")}`,
      }),
    });
  });

  await page.goto("/create");

  await page.getByRole("button", { name: /connect wallet/i }).click();
  await expect(page.getByRole("button", { name: /gcfm4v.*cdef/i })).toBeVisible();

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
