import { expect, test } from "next/experimental/testmode/playwright";

import { authenticatePage } from "./helpers/auth";
import { TRACKING_ID, VENDOR_KEY } from "./helpers/constants";
import { type MockEscrow,setupNetworkMocks } from "./helpers/mock-api";

const escrowId = "escrow-ship-1";

const mockEscrow: MockEscrow = {
  id: escrowId,
  vendorId: VENDOR_KEY,
  buyerId: "GCBUYER8TESTING1234567890ABCDEF",
  item: "Vintage Camera",
  amount: 249.99,
  status: "FUNDED",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  history: [],
};

test("vendor mark shipped updates vendor and buyer status", async ({ page, next }) => {
  await authenticatePage(page);

  const escrowsList = [{ ...mockEscrow }];
  await setupNetworkMocks(page, next, {
    escrowId,
    mockEscrow: { ...mockEscrow, status: "SHIPPED" },
    mockEscrowsList: escrowsList
  });

  await page.goto("/dashboard");

  await page.getByRole("button", { name: /mark shipped/i }).click();
  await page.getByLabel("Tracking ID").fill(TRACKING_ID);
  
  // Update the mock list before submitting so the refresh gets the new state
  escrowsList[0] = { ...mockEscrow, status: "SHIPPED" };
  
  await page.getByRole("button", { name: /submit/i }).click();

  await expect(page.getByText("SHIPPED", { exact: true })).toBeVisible();

  await page.goto(`/track/${escrowId}`);
  await expect(page.getByText("SHIPPED", { exact: true })).toBeVisible();
});
