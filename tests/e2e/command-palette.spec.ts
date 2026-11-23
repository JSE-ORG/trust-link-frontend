import { expect, type Page, test } from "@playwright/test";

import { authenticatePage } from "./helpers/auth";

/**
 * Issue #1085 — the command palette is mounted in the root layout, so its
 * shortcut works on every page, and it is the only navigation surface with no
 * Playwright coverage at all. The jsdom suite exercises the state behind it;
 * these specs exercise what only a real browser can show: the shortcut reaching
 * the document-level listener, focus landing in the combobox, a client-side
 * route change, and the overlay dismissing itself.
 */

const dialog = (page: Page) => page.getByRole("dialog", { name: "Command palette" });

const searchInput = (page: Page) => page.getByRole("combobox", { name: "Search commands" });

const options = (page: Page) => dialog(page).getByRole("option");

const option = (page: Page, name: string) => options(page).filter({ hasText: name });

/** Opens the palette the way a keyboard user does: the global Cmd/Ctrl+K listener. */
async function openPalette(page: Page) {
  await page.goto("/");
  await page.keyboard.press("Control+k");
  await expect(dialog(page)).toBeVisible();
}

test.describe("command palette search and shortcut navigation", () => {
  test("opens with the shortcut, moves focus into the search field, and closes on Escape", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(dialog(page)).toHaveCount(0);

    await page.keyboard.press("Control+k");
    await expect(dialog(page)).toBeVisible();

    // FocusTrap focuses `initialFocusRef` on the next animation frame, so this
    // also proves the trap actually took focus rather than just rendering.
    await expect(searchInput(page)).toBeFocused();

    await page.keyboard.press("Escape");
    await expect(dialog(page)).toHaveCount(0);
  });

  test("pressing the shortcut again toggles the palette closed", async ({ page }) => {
    await openPalette(page);

    await page.keyboard.press("Control+k");
    await expect(dialog(page)).toHaveCount(0);
  });

  test("filters the result list by label and by description", async ({ page }) => {
    await openPalette(page);

    // Matches the "Analytics" label.
    await searchInput(page).fill("analy");
    await expect(option(page, "Analytics")).toBeVisible();
    await expect(option(page, "Create Escrow")).toHaveCount(0);

    // "shipment" appears only inside the Tracking row's description, so this
    // single match can only come from the description branch of the filter.
    await searchInput(page).fill("shipment");
    await expect(option(page, "Tracking")).toBeVisible();
    await expect(options(page)).toHaveCount(1);

    await searchInput(page).fill("no-such-command");
    await expect(options(page)).toHaveCount(0);
    await expect(dialog(page).getByRole("status")).toHaveText("No results found.");
  });

  test("clearing the query restores the full command list", async ({ page }) => {
    await openPalette(page);

    await searchInput(page).fill("profile");
    await expect(options(page)).toHaveCount(1);

    await searchInput(page).fill("");
    await expect(options(page)).toHaveCount(7);
  });

  test("selecting a result navigates to the analytics route and closes the palette", async ({
    page,
  }) => {
    // /dashboard/analytics sends unauthenticated visitors home, which would make
    // the URL assertion say nothing about the palette.
    await authenticatePage(page);
    await openPalette(page);

    await searchInput(page).fill("analy");
    await option(page, "Analytics").click();

    await expect(page).toHaveURL("/dashboard/analytics");
    await expect(dialog(page)).toHaveCount(0);
  });

  test("clicking the backdrop closes the palette", async ({ page }) => {
    await openPalette(page);

    // The panel is centred and capped at `max-w-xl`, so the far-left edge of the
    // viewport is the overlay itself.
    await page.mouse.click(5, 300);
    await expect(dialog(page)).toHaveCount(0);
  });
});
