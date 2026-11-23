import type { Page } from "@playwright/test";
import { expect, type NextFixture, test } from "next/experimental/testmode/playwright";

import { JWT, VENDOR_KEY } from "./helpers/constants";
import { setupNetworkMocks } from "./helpers/mock-api";
import { mockFreighter } from "./helpers/mock-freighter";

/**
 * Issue #1084 — the wallet UI has no end-to-end coverage of its own. The
 * neighbouring specs mock a session token straight into `localStorage` and start
 * from an already-authenticated page, so nothing proves that a real connect click
 * drives the SEP-10 round trip, that the account chip shows the key, or that
 * Disconnect takes the session back down again.
 *
 * `/create` renders the button twice — the compact Navbar copy and the hero copy
 * under test — so every locator is scoped to `<main>`.
 */

/** The page body, excluding the sticky Navbar's own copy of the wallet button. */
function wallet(page: Page) {
  return page.getByRole("main");
}

async function openCreatePage(page: Page, next: NextFixture) {
  await setupNetworkMocks(page, next);
  await mockFreighter(page);
  await page.goto("/create");
}

const connectButton = (page: Page) =>
  wallet(page).getByRole("button", { name: "Connect Wallet", exact: true });

/** `truncateAddress(publicKey, 4, 4)` is what the connected chip renders. */
const accountChip = (page: Page) =>
  wallet(page).getByRole("button", { name: "GCFM...CDEF", exact: true });

const dropdown = (page: Page) => wallet(page).getByRole("menu");

const disconnectItem = (page: Page) =>
  dropdown(page).getByRole("menuitem", { name: "Disconnect", exact: true });

test.describe("Freighter connect and disconnect flow", () => {
  test("connects the mocked account and shows the public key truncated", async ({
    page,
    next,
  }) => {
    await openCreatePage(page, next);

    await expect(connectButton(page)).toBeVisible();
    await connectButton(page).click();

    await expect(accountChip(page)).toBeVisible();
    await expect(
      page.locator("[data-sonner-toast]").filter({ hasText: "Wallet connected" })
    ).toBeVisible();

    // The chip only appears once `authenticate()` resolves, so the
    // challenge/verify round trip has already written both credentials.
    const stored = await page.evaluate(() => ({
      publicKey: window.localStorage.getItem("wallet.publicKey"),
      jwt: window.localStorage.getItem("wallet.jwt"),
    }));
    expect(stored).toEqual({ publicKey: VENDOR_KEY, jwt: JWT });
  });

  test("dropdown exposes the account and Disconnect clears the session and resets the button", async ({
    page,
    next,
  }) => {
    // Legacy keys an older release may have left behind; disconnecting is
    // expected to remove them alongside the current ones.
    await page.addInitScript(() => {
      window.localStorage.setItem("wallet.token", "legacy-token");
      window.localStorage.setItem("wallet.jwk", "legacy-jwk");
      window.localStorage.setItem("wallet.session", "legacy-session");
    });
    await openCreatePage(page, next);

    await connectButton(page).click();
    await expect(accountChip(page)).toHaveAttribute("aria-expanded", "false");

    await accountChip(page).click();
    await expect(accountChip(page)).toHaveAttribute("aria-expanded", "true");

    await expect(dropdown(page)).toBeVisible();
    await expect(dropdown(page).getByText(VENDOR_KEY)).toBeVisible();
    await expect(disconnectItem(page)).toBeVisible();

    await disconnectItem(page).click();

    await expect(dropdown(page)).toHaveCount(0);
    await expect(connectButton(page)).toBeVisible();
    await expect(
      page.locator("[data-sonner-toast]").filter({ hasText: "Wallet disconnected" })
    ).toBeVisible();

    // Each of these was non-null immediately before the click, so a cleanup that
    // stops working cannot pass by accident.
    const stored = await page.evaluate(() => ({
      publicKey: window.localStorage.getItem("wallet.publicKey"),
      jwt: window.localStorage.getItem("wallet.jwt"),
      token: window.localStorage.getItem("wallet.token"),
      jwk: window.localStorage.getItem("wallet.jwk"),
      session: window.localStorage.getItem("wallet.session"),
    }));
    expect(stored).toEqual({
      publicKey: null,
      jwt: null,
      token: null,
      jwk: null,
      session: null,
    });

    // A reload must not resurrect a session from whatever survived in storage.
    await page.reload();
    await expect(connectButton(page)).toBeVisible();
  });

  test("reconnecting after a disconnect works without a page reload", async ({
    page,
    next,
  }) => {
    await openCreatePage(page, next);

    await connectButton(page).click();
    await accountChip(page).click();
    await disconnectItem(page).click();
    await expect(accountChip(page)).toHaveCount(0);

    await connectButton(page).click();
    await expect(accountChip(page)).toBeVisible();

    const stored = await page.evaluate(() => ({
      publicKey: window.localStorage.getItem("wallet.publicKey"),
      jwt: window.localStorage.getItem("wallet.jwt"),
    }));
    expect(stored).toEqual({ publicKey: VENDOR_KEY, jwt: JWT });
  });
});
