import { expect, test } from "@playwright/test";

const STATUSES = ["Pending", "Funded", "Shipped", "Completed", "Disputed", "Released", "Refunded", "Expired"];

test.describe("EscrowStatusBadge visual regression", () => {
  test("renders all badge variants and matches baseline snapshot", async ({ page }) => {
    await page.goto("/badge-visual-test");

    await expect(page.getByText("EscrowStatusBadge Variants")).toBeVisible();

    await expect(page).toHaveScreenshot("escrow-status-badge-variants.png", {
      maxDiffPixelRatio: 0.02,
      timeout: 20_000,
    });
  });

  for (const status of STATUSES) {
    test(`badge variant "${status}" matches snapshot`, async ({ page }) => {
      await page.goto("/badge-visual-test");

      const row = page.locator(`text=${status}`).first();
      await expect(row).toBeVisible();

      // EscrowStatusBadge renders "Status updated to: …" inside a plain div
      // with aria-live (no role="status"), so locate it by its label text.
      const badge = row.locator("..").getByText(/Status updated to:/);
      await expect(badge).toBeVisible();

      await expect(badge).toHaveScreenshot(`badge-${status.toLowerCase()}.png`, {
        maxDiffPixelRatio: 0.02,
      });
    });
  }
});
