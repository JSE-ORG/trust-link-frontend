import { expect,test } from "next/experimental/testmode/playwright";

import { BUYER_ID, VENDOR_ID } from "./helpers/constants";
import {
  type MockDispute,
  type MockEscrow,
  setupNetworkMocks,
} from "./helpers/mock-api";

const TEST_ESCROW_ID = "test_escrow_dispute_001";

const mockEscrow: MockEscrow = {
  id: TEST_ESCROW_ID,
  vendorId: VENDOR_ID,
  buyerId: BUYER_ID,
  amount: 75.0,
  item: "Wireless Headphones",
  status: "SHIPPED",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  history: [],
};

const mockDisputeResponse: MockDispute = {
  id: "dispute-001",
  escrowId: TEST_ESCROW_ID,
  buyerId: BUYER_ID,
  reason: "Item Not Received",
  description: "The package never arrived despite the tracking showing delivered.",
  evidence: ["https://example.com/evidence-dummy.jpg"],
  status: "OPEN",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

test.describe("Dispute submission flow", () => {
  test.beforeEach(async ({ page, next }) => {
    await setupNetworkMocks(page, next, {
      escrowId: TEST_ESCROW_ID,
      mockEscrow,
      mockDispute: mockDisputeResponse,
    });
  });

  test("navigates to the dispute page and renders the form", async ({ page }) => {
    await page.goto(`/dispute/${TEST_ESCROW_ID}`);

    // Page header should be visible
    await expect(page.getByRole("heading", { name: "Raise a Dispute" })).toBeVisible();
    
    // Escrow item name should appear
    await expect(page.getByText("Wireless Headphones", { exact: true })).toBeVisible();
    
    // Form fields should be visible
    await expect(page.getByLabel(/Reason for dispute/i)).toBeVisible();
    await expect(page.getByText(/Evidence files/i)).toBeVisible();
  });

  test("completes form and submits the dispute", async ({ page }) => {
    await page.goto(`/dispute/${TEST_ESCROW_ID}`);

    // Fill reason
    const reasonInput = page.getByLabel(/Reason for dispute/i);
    await expect(async () => {
      await reasonInput.fill("The package never arrived despite the tracking showing delivered.");
      expect(await reasonInput.inputValue()).toBe("The package never arrived despite the tracking showing delivered.");
    }).toPass({ timeout: 5000 });
    
    // Upload evidence
    // In Playwright, we can just dispatch an event or set files on the input
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText(/Upload images or PDFs/i).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
        name: 'evidence-dummy.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('dummy-image-content')
    });

    // Submit the dispute
    await page.getByRole("button", { name: /Submit dispute/i }).click();

    // Should show success state
    await expect(page.getByRole("heading", { name: "Dispute submitted" })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Reference ID: dispute-001/i)).toBeVisible();
  });

  test("validates description minimum length", async ({ page }) => {
    await page.goto(`/dispute/${TEST_ESCROW_ID}`);

    // Enter a short description
    await page.getByLabel(/Reason for dispute/i).fill("Short");
    
    // Try to submit
    await page.getByRole("button", { name: /Submit dispute/i }).click();

    // Should show validation error
    await expect(page.getByText(/at least 20 characters/i)).toBeVisible();
  });

  test("validates that at least one evidence is required", async ({ page }) => {
    await page.goto(`/dispute/${TEST_ESCROW_ID}`);

    // Fill valid reason but no evidence
    const reasonInput = page.getByLabel(/Reason for dispute/i);
    await expect(async () => {
      await reasonInput.fill("The package never arrived despite the tracking showing delivered.");
      expect(await reasonInput.inputValue()).toBe("The package never arrived despite the tracking showing delivered.");
    }).toPass({ timeout: 5000 });

    // Try to proceed without adding evidence
    await page.getByRole("button", { name: /Submit dispute/i }).click();

    // Should show validation error
    await expect(page.getByText(/at least one image or PDF/i)).toBeVisible();
  });

  test("shows error toast when dispute creation fails", async ({ page }) => {
    // Override the dispute API on the client to return an error
    await page.route("**/api/escrows/*/dispute", async (route) => {
      if (route.request().method() === "POST") {
        return route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ message: "Internal server error" }),
        });
      }
      return route.continue();
    });

    await page.goto(`/dispute/${TEST_ESCROW_ID}`);

    // Fill form
    await page.getByLabel(/Reason for dispute/i).fill("The package never arrived despite the tracking showing delivered.");
    
    const fileChooserPromise = page.waitForEvent('filechooser');
    await page.getByText(/Upload images or PDFs/i).click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
        name: 'evidence-dummy.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('dummy-image-content')
    });

    // Submit
    await page.getByRole("button", { name: /Submit dispute/i }).click();

    // Should show error toast
    await expect(page.getByText(/Internal server error/i).first()).toBeVisible({ timeout: 10_000 });
  });
});
