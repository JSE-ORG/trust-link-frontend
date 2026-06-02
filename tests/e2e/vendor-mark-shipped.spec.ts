import { expect, test } from "@playwright/test";

const escrowId = "escrow-ship-1";

test("vendor mark shipped updates vendor and buyer status", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("wallet.jwt", "jwt-token");
  });

  await page.route("**/vendor/escrows", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          id: escrowId,
          vendorId: "GCFM4VENDOR8TESTING1234567890ABCDEF",
          buyerId: "GCBUYER8TESTING1234567890ABCDEF",
          item: "Vintage Camera",
          amount: 249.99,
          status: "FUNDED",
          createdAt: "2026-01-01T00:00:00Z",
          updatedAt: "2026-01-01T00:00:00Z",
          history: [],
        },
      ]),
    });
  });

  await page.route(`**/escrow/${escrowId}/ship`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: escrowId,
        vendorId: "GCFM4VENDOR8TESTING1234567890ABCDEF",
        buyerId: "GCBUYER8TESTING1234567890ABCDEF",
        item: "Vintage Camera",
        amount: 249.99,
        status: "SHIPPED",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-02T00:00:00Z",
        history: [],
        trackingId: "TRACK-123",
        carrier: "Terminal Africa",
      }),
    });
  });

  await page.route(`**/escrow/${escrowId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        id: escrowId,
        vendorId: "GCFM4VENDOR8TESTING1234567890ABCDEF",
        buyerId: "GCBUYER8TESTING1234567890ABCDEF",
        item: "Vintage Camera",
        amount: 249.99,
        status: "SHIPPED",
        createdAt: "2026-01-01T00:00:00Z",
        updatedAt: "2026-01-02T00:00:00Z",
        history: [],
      }),
    });
  });

  await page.goto("/dashboard");

  await page.getByRole("button", { name: /mark shipped/i }).click();
  await page.getByLabel("Tracking ID").fill("TRACK-123");
  await page.getByRole("button", { name: /submit/i }).click();

  await expect(page.getByText("SHIPPED")).toBeVisible();

  await page.goto(`/track/${escrowId}`);
  await expect(page.getByText("SHIPPED")).toBeVisible();
});
