import { expect, test } from "@playwright/test";

const disputeId = "dispute-1";
let isResolved = false;

const mockDispute = {
  id: disputeId,
  escrowId: "escrow-42",
  buyerId: "GBUYER8TESTING1234567890ABCDEF",
  reason: "Item not received",
  evidence: ["https://example.com/evidence.jpg"],
  status: "OPEN",
  escrow: {
    id: "escrow-42",
    vendorId: "GCFM4VENDOR8TESTING1234567890ABCDEF",
    buyerId: "GBUYER8TESTING1234567890ABCDEF",
    item: "Gold Necklace",
    amount: 180.0,
    status: "DISPUTED",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    history: [],
  },
};

test("admin can resolve a dispute and the dispute list updates", async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("wallet.jwt", "jwt-token");
  });

  await page.route("**/disputes?status=OPEN,UNDER_REVIEW", async (route) => {
    const body = isResolved ? [] : [mockDispute];
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    });
  });

  await page.route(`**/disputes/${disputeId}`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(mockDispute),
    });
  });

  await page.route(`**/disputes/${disputeId}/resolve`, async (route) => {
    isResolved = true;
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ...mockDispute,
        status: "RESOLVED",
        resolution: "RELEASE_TO_VENDOR",
      }),
    });
  });

  await page.goto("/admin/disputes");

  await expect(page.getByText("Admin Disputes")).toBeVisible();
  await page.getByRole("link", { name: /view dispute/i }).click();

  await expect(page.getByText(/release to vendor/i)).toBeVisible();
  await page.getByRole("button", { name: /release to vendor/i }).click();
  await page.getByRole("button", { name: /confirm/i }).click();

  await expect(page.getByText(/no open disputes right now/i)).toBeVisible();
});
