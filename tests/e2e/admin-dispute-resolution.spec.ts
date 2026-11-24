import { expect, test } from "next/experimental/testmode/playwright";

import { authenticatePage, restoreWalletSession } from "./helpers/auth";
import { BUYER_KEY, VENDOR_KEY } from "./helpers/constants";
import { type MockDispute, setupNetworkMocks } from "./helpers/mock-api";
import { mockFreighter } from "./helpers/mock-freighter";

const disputeId = "dispute-1";

const mockDispute: MockDispute = {
  id: disputeId,
  escrowId: "escrow-42",
  buyerId: BUYER_KEY,
  reason: "Item not received",
  evidence: ["https://example.com/evidence.jpg"],
  status: "OPEN",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-02T00:00:00Z",
  escrow: {
    id: "escrow-42",
    vendorId: VENDOR_KEY,
    buyerId: BUYER_KEY,
    item: "Gold Necklace",
    amount: 180.0,
    status: "DISPUTED",
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-02T00:00:00Z",
    history: [],
  },
};

test("admin can resolve a dispute and the dispute list updates", async ({ page, next }) => {
  await authenticatePage(page);
  await restoreWalletSession(page);
  await mockFreighter(page);

  // Mocked entirely through the shared options so it works identically for
  // same-origin and cross-origin API setups. The resolve POST is deliberately
  // slow (1.5s) so the assertions below prove the badge updates optimistically
  // rather than after the response, and the list automatically empties once
  // the dispute is resolved.
  await setupNetworkMocks(page, next, {
    mockDispute,
    adminResolveDispute: { disputeId, delayMs: 1_500 },
  });

  await page.goto("/admin/disputes");

  // By role: the streamed page also carries a hidden copy of the heading, which a text
  // match counts as a second element.
  await expect(page.getByRole("heading", { name: "Admin Disputes" })).toBeVisible();
  
  // Navigate directly to the dispute details page to avoid Next.js RSC client navigation issues
  await page.goto(`/admin/disputes/${disputeId}`);

  const releaseButton = page.getByRole("button", { name: "Release to Vendor", exact: true });
  await expect(releaseButton.first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId("dispute-status-badge")).toHaveText("OPEN");

  // Retry the whole interaction: the action buttons exist in the SSR HTML
  // before React hydrates, so a click landing early silently does nothing.
  // Once the first click lands post-hydration, the badges flip optimistically
  // while the (deliberately slow) 1.5s resolve request is still in flight.
  const confirmButton = page.getByRole("button", { name: "Confirm", exact: true });
  await expect(async () => {
    await releaseButton.first().click({ timeout: 2_000 });
    await confirmButton.first().click({ timeout: 2_000 });
    await expect(page.getByTestId("dispute-status-badge")).toHaveText("RESOLVED", { timeout: 500 });
  }).toPass({ timeout: 15_000 });
  await expect(page.getByTestId("escrow-status-badge")).toHaveText("RELEASED", { timeout: 1_000 });

  // The list defaults to the "All" filter, so the empty state reads "No disputes right now."
  await expect(page.getByText(/no disputes right now/i)).toBeVisible({ timeout: 10_000 });
});
