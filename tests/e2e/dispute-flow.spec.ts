import { expect, test } from "next/experimental/testmode/playwright";

import { BUYER_ID, VENDOR_ID } from "./helpers/constants";
import {
  type MockApiOptions,
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
  // The api client validates dispute responses (types/guards.ts isDispute),
  // which requires the nested escrow — not just the escrowId.
  escrow: mockEscrow,
};

test.describe("Dispute submission flow", () => {
  // Shared, mutable so individual tests can toggle behaviour (e.g. the error
  // toast test) without re-registering the network mocks.
  const mockOptions: MockApiOptions = {
    escrowId: TEST_ESCROW_ID,
    mockEscrow,
    mockDispute: mockDisputeResponse,
  };

  test.beforeEach(async ({ page, next }) => {
    mockOptions.disputePostError = false;
    await setupNetworkMocks(page, next, mockOptions);
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
    // Toggle the shared mock so the dispute POST responds with a server error.
    mockOptions.disputePostError = true;

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

test.describe("Complete dispute filing flow (4-step wizard)", () => {
  test("navigates all 4 steps, uploads evidence, agrees to terms, and submits", async ({
    page,
  }) => {
    // The multi-step wizard posts to /api/dispute on submit — stub it out.
    await page.route("**/api/dispute", async (route) => {
      if (route.request().method() === "POST") {
        return route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: "dispute-001", message: "Submitted" }),
        });
      }
      return route.continue();
    });

    await page.goto("/dispute-form-test");

    // Wizard starts on step 1 with the 4-step progress indicator visible.
    await expect(page.getByTestId("step-1")).toBeVisible();
    await expect(page.getByText("Step 4: Review", { exact: true })).toBeVisible();

    // --- Step 1: Info ---
    // Fill with a settle window: React hydration can otherwise reset the value
    // shortly after fill(), so retry until the typed value survives.
    await expect(async () => {
      await page.getByLabel("name").fill("John Doe");
      await expect(page.getByLabel("name")).toHaveValue("John Doe", { timeout: 500 });
      await page.waitForTimeout(200);
      await expect(page.getByLabel("name")).toHaveValue("John Doe", { timeout: 500 });
    }).toPass({ timeout: 10_000 });
    await expect(async () => {
      await page.getByLabel("email").fill("john@example.com");
      await expect(page.getByLabel("email")).toHaveValue("john@example.com", { timeout: 500 });
      await page.waitForTimeout(200);
      await expect(page.getByLabel("email")).toHaveValue("john@example.com", { timeout: 500 });
    }).toPass({ timeout: 10_000 });
    await expect(async () => {
      await page.getByLabel("order number").fill("ORD-12345");
      await expect(page.getByLabel("order number")).toHaveValue("ORD-12345", { timeout: 500 });
      await page.waitForTimeout(200);
      await expect(page.getByLabel("order number")).toHaveValue("ORD-12345", { timeout: 500 });
    }).toPass({ timeout: 10_000 });
    await page.getByTestId("next-button").click();

    // --- Step 2: Details ---
    await expect(page.getByTestId("step-2")).toBeVisible();
    await page.getByLabel("reason").selectOption("product_not_received");
    await expect(async () => {
      await page
        .getByLabel("description")
        .fill("I never received my wireless headphones despite delivery confirmation.");
      await expect(page.getByLabel("description")).toHaveValue(
        "I never received my wireless headphones despite delivery confirmation.",
        { timeout: 500 }
      );
      await page.waitForTimeout(200);
      await expect(page.getByLabel("description")).toHaveValue(
        "I never received my wireless headphones despite delivery confirmation.",
        { timeout: 500 }
      );
    }).toPass({ timeout: 10_000 });
    await page.getByTestId("next-button").click();

    // --- Step 3: Evidence ---
    await expect(page.getByTestId("step-3")).toBeVisible();
    await page.getByTestId("file-input").setInputFiles({
      name: "evidence-dummy.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("dummy-image-content"),
    });
    await expect(page.getByTestId("file-list")).toBeVisible();
    await expect(page.getByText("evidence-dummy.jpg")).toBeVisible();
    await page.getByTestId("next-button").click();

    // --- Step 4: Review ---
    await expect(page.getByTestId("step-4")).toBeVisible();
    await expect(page.getByText("Name: John Doe")).toBeVisible();
    await expect(page.getByText("Email: john@example.com")).toBeVisible();
    await expect(page.getByText("Order Number: ORD-12345")).toBeVisible();
    await expect(page.getByText("Reason: product_not_received")).toBeVisible();
    await expect(
      page.getByText("Description: I never received my wireless headphones despite delivery confirmation.")
    ).toBeVisible();
    await expect(page.getByText("1 file(s) uploaded")).toBeVisible();
    await expect(page.getByText("evidence-dummy.jpg")).toBeVisible();

    // Agree to terms and submit
    await page.getByLabel("agree to terms").check();
    await page.getByTestId("submit-button").click();

    // --- Success state ---
    await expect(page.getByTestId("success-state")).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole("heading", { name: /Dispute Submitted Successfully/i })
    ).toBeVisible();
    await expect(
      page.getByText("Your dispute has been submitted successfully!")
    ).toBeVisible();
  });
});
