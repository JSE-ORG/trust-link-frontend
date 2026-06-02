import { test, expect } from "@playwright/test";

const TEST_ESCROW_ID = "test_escrow_dispute_001";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

const mockEscrow = {
  id: TEST_ESCROW_ID,
  vendorId: "vendor_test_1",
  buyerId: "buyer_test_1",
  amount: 75.0,
  item: "Wireless Headphones",
  status: "SHIPPED",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  history: [],
};

const mockDisputeResponse = {
  id: "dispute-001",
  escrowId: TEST_ESCROW_ID,
  buyerId: "buyer_test_1",
  reason: "Item Not Received",
  description: "The package never arrived despite the tracking showing delivered.",
  evidence: ["https://example.com/evidence-dummy.jpg"],
  status: "OPEN",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

test.describe("Dispute submission flow", () => {
  test.beforeEach(async ({ page }) => {
    // Mock escrow API (both singular and plural endpoints)
    await page.route(`${API_URL}/escrow/${TEST_ESCROW_ID}`, (route) => {
      route.fulfill({ json: mockEscrow });
    });
    await page.route(`${API_URL}/escrows/${TEST_ESCROW_ID}`, (route) => {
      route.fulfill({ json: mockEscrow });
    });

    // Mock dispute creation API
    await page.route(`${API_URL}/escrows/${TEST_ESCROW_ID}/dispute`, (route) => {
      route.fulfill({ json: mockDisputeResponse });
    });
  });

  test("navigates to the dispute page and renders the form", async ({ page }) => {
    await page.goto(`/dispute/${TEST_ESCROW_ID}`);

    // Page header should be visible
    await expect(page.getByText("Raise a Dispute")).toBeVisible();
    // Escrow item name should appear
    await expect(page.getByText("Wireless Headphones")).toBeVisible();
    // Step 1 should show reason selection
    await expect(page.getByText("What's the issue?")).toBeVisible();
  });

  test("completes all form steps and submits the dispute", async ({ page }) => {
    await page.goto(`/dispute/${TEST_ESCROW_ID}`);

    // Step 1: Select a reason
    await page.getByText("Item Not Received").click();
    await page.getByRole("button", { name: /continue/i }).click();

    // Step 2: Enter description
    await expect(page.getByText("Describe the issue")).toBeVisible();
    await page.getByPlaceholder("Tell us what happened...").fill(
      "The package never arrived despite the tracking showing delivered. I have waited over two weeks."
    );
    await page.getByRole("button", { name: /continue/i }).click();

    // Step 3: Add evidence (uses dummy URL via button click)
    await expect(page.getByText("Upload evidence")).toBeVisible();
    await page.getByRole("button", { name: /select files/i }).click();

    // Evidence should appear
    await expect(page.getByText("Evidence 1")).toBeVisible();
    await page.getByRole("button", { name: /continue/i }).click();

    // Step 4: Review and submit
    await expect(page.getByText("Review and submit")).toBeVisible();
    await expect(page.getByText("Item Not Received")).toBeVisible();

    // Submit the dispute
    await page.getByRole("button", { name: /submit dispute/i }).click();

    // Should show success toast and redirect to tracking page
    await expect(page.getByText("Dispute raised successfully")).toBeVisible({ timeout: 10_000 });
    await expect(page).toHaveURL(`/track/${TEST_ESCROW_ID}`, { timeout: 10_000 });
  });

  test("validates that a reason must be selected before proceeding", async ({ page }) => {
    await page.goto(`/dispute/${TEST_ESCROW_ID}`);

    // Try to continue without selecting a reason
    await page.getByRole("button", { name: /continue/i }).click();

    // Should show validation error
    await expect(page.getByText(/please select a reason/i)).toBeVisible();
  });

  test("validates description minimum length", async ({ page }) => {
    await page.goto(`/dispute/${TEST_ESCROW_ID}`);

    // Select reason and proceed
    await page.getByText("Item Not Received").click();
    await page.getByRole("button", { name: /continue/i }).click();

    // Enter a short description
    await page.getByPlaceholder("Tell us what happened...").fill("Short");
    await page.getByRole("button", { name: /continue/i }).click();

    // Should show validation error
    await expect(page.getByText(/at least 10 characters/i)).toBeVisible();
  });

  test("validates that at least one evidence is required", async ({ page }) => {
    await page.goto(`/dispute/${TEST_ESCROW_ID}`);

    // Complete steps 1 and 2
    await page.getByText("Item Not Received").click();
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByPlaceholder("Tell us what happened...").fill(
      "The package never arrived despite the tracking showing delivered."
    );
    await page.getByRole("button", { name: /continue/i }).click();

    // Try to proceed without adding evidence
    await page.getByRole("button", { name: /continue/i }).click();

    // Should show validation error
    await expect(page.getByText(/at least one piece of evidence/i)).toBeVisible();
  });

  test("allows navigating back to previous steps", async ({ page }) => {
    await page.goto(`/dispute/${TEST_ESCROW_ID}`);

    // Step 1: Select reason and proceed
    await page.getByText("Item Not Received").click();
    await page.getByRole("button", { name: /continue/i }).click();

    // Step 2: Go back
    await expect(page.getByText("Describe the issue")).toBeVisible();
    await page.getByRole("button", { name: /back/i }).click();

    // Should be back on step 1 with reason still selected
    await expect(page.getByText("What's the issue?")).toBeVisible();
  });

  test("shows error toast when dispute creation fails", async ({ page }) => {
    // Override the dispute API to return an error
    await page.route(`${API_URL}/escrows/${TEST_ESCROW_ID}/dispute`, (route) => {
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ message: "Internal server error" }),
      });
    });

    await page.goto(`/dispute/${TEST_ESCROW_ID}`);

    // Complete all steps
    await page.getByText("Item Not Received").click();
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByPlaceholder("Tell us what happened...").fill(
      "The package never arrived despite the tracking showing delivered."
    );
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByRole("button", { name: /select files/i }).click();
    await page.getByRole("button", { name: /continue/i }).click();
    await page.getByRole("button", { name: /submit dispute/i }).click();

    // Should show error toast
    await expect(page.getByText(/failed to raise dispute/i)).toBeVisible({ timeout: 10_000 });
  });
});
