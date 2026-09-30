import { expect, test } from "next/experimental/testmode/playwright";

import { setupNetworkMocks } from "./helpers/mock-api";

test("vendor dashboard displays empty state with CTA when no escrows exist", async ({ page, next }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem("wallet.jwt", "jwt-token");
  });

  await setupNetworkMocks(page, next, {
    mockEscrowsList: []
  });

  await page.goto("/dashboard");

  await expect(page.getByText("No escrows yet")).toBeVisible();
  await expect(page.getByText("Create your first escrow payment link to begin receiving secure payments.")).toBeVisible();

  const ctaBtn = page.getByRole("link", { name: /create your first escrow link/i });
  await expect(ctaBtn).toBeVisible();
  await expect(ctaBtn).toHaveAttribute("href", "/create");
});
