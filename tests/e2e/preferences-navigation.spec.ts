import { expect, test } from "@playwright/test";

test.describe("language and theme preferences across client navigation", () => {
  test.use({ colorScheme: "light", locale: "en-US" });

  test.beforeEach(async ({ page }) => {
    // Ensure deterministic clean preference state before each run. An init script runs on
    // every document load, so it must reset only the first one: resetting on /about and on
    // reload would erase the very preferences this test checks for persistence.
    await page.addInitScript(() => {
      if (window.sessionStorage.getItem("e2e-preferences-reset")) return;
      window.sessionStorage.setItem("e2e-preferences-reset", "1");
      window.localStorage.removeItem("trustlink.language");
      window.localStorage.removeItem("theme");
    });
  });

  test.afterEach(async ({ page }) => {
    // Restore preference state so test does not depend on or alter machine defaults
    await page.evaluate(() => {
      window.localStorage.removeItem("trustlink.language");
      window.localStorage.removeItem("theme");
    });
  });

  test("persists language and theme across navigation and page reload", async ({ page }) => {
    await page.goto("/");

    // Verify initial default state (English and light theme)
    const languageSelect = page.locator("#language-select");
    await expect(languageSelect).toBeVisible();
    await expect(languageSelect).toHaveValue("en");
    await expect(page.locator("label[for='language-select']")).toHaveText("Language:");
    await expect(page.locator("html")).not.toHaveClass(/dark/);

    // Switch language to French using the actual footer select control
    await languageSelect.selectOption("fr");
    await expect(languageSelect).toHaveValue("fr");
    // Representative translated label in the footer updates to French
    await expect(page.locator("label[for='language-select']")).toHaveText("Langue:");
    await expect(languageSelect).toHaveAttribute("aria-label", "Choisir la langue");

    // Switch theme to dark using the actual theme toggle button in navbar
    const themeButton = page.getByRole("button", { name: "Switch to dark mode" });
    await expect(themeButton).toBeVisible();
    await themeButton.click();

    // Verify theme updated immediately to dark
    await expect(page.locator("html")).toHaveClass(/dark/);
    const storedTheme = await page.evaluate(() => window.localStorage.getItem("theme"));
    const storedLang = await page.evaluate(() => window.localStorage.getItem("trustlink.language"));
    expect(storedTheme).toBe("dark");
    expect(storedLang).toBe("fr");

    // Navigate to a second existing route (/about)
    await page.goto("/about");
    await expect(page).toHaveURL("/about");
    await expect(page.getByRole("heading", { name: /About TrustLink/i })).toBeVisible();

    // Verify both preferences survived route navigation
    await expect(page.locator("html")).toHaveClass(/dark/);
    const aboutLanguageSelect = page.locator("#language-select");
    await expect(aboutLanguageSelect).toHaveValue("fr");
    await expect(page.locator("label[for='language-select']")).toHaveText("Langue:");
    await expect(aboutLanguageSelect).toHaveAttribute("aria-label", "Choisir la langue");

    // Reload the page and assert persistence after reload
    await page.reload();
    await expect(page.locator("html")).toHaveClass(/dark/);
    const reloadedLanguageSelect = page.locator("#language-select");
    await expect(reloadedLanguageSelect).toHaveValue("fr");
    await expect(page.locator("label[for='language-select']")).toHaveText("Langue:");
  });
});
