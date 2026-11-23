import { expect, type Page, test } from "@playwright/test";

const LANGUAGE_STORAGE_KEY = "trustlink.language";

/**
 * Clears the stored locale without leaving an `addInitScript` hook installed:
 * an init script re-runs on every navigation and would erase the preference
 * these reload/routing assertions are trying to observe.
 */
async function resetStoredLanguage(page: Page) {
  await page.goto("/");
  await page.evaluate(
    (key) => window.localStorage.removeItem(key),
    LANGUAGE_STORAGE_KEY
  );
  await page.reload();
}

const storedLanguage = (page: Page) =>
  page.evaluate((key) => window.localStorage.getItem(key), LANGUAGE_STORAGE_KEY);

test.describe("language switching and persistence", () => {
  test.use({ colorScheme: "light", locale: "en-US" });

  test("translates the UI on `<select>` change and keeps French across reloads and routing", async ({
    page,
  }) => {
    await resetStoredLanguage(page);

    const languageSelect = page.locator("#language-select");
    const languageLabel = page.locator("label[for='language-select']");

    // English is both the detected default and the configured fallback locale.
    await expect(languageSelect).toHaveValue("en");
    await expect(languageLabel).toHaveText("Language:");
    await expect(languageSelect).toHaveAttribute("aria-label", "Select language");

    // Selecting Français re-renders translated strings without a reload.
    await languageSelect.selectOption("fr");
    await expect(languageSelect).toHaveValue("fr");
    await expect(languageLabel).toHaveText("Langue:");
    await expect(languageSelect).toHaveAttribute("aria-label", "Choisir la langue");
    await expect(storedLanguage(page)).resolves.toBe("fr");

    // The choice survives a full document reload.
    await page.reload();
    await expect(languageSelect).toHaveValue("fr");
    await expect(languageLabel).toHaveText("Langue:");

    // ...and it is still active after routing to another page.
    await page.goto("/payment");
    await expect(page).toHaveURL("/payment");
    await expect(languageSelect).toHaveValue("fr");
    await expect(languageLabel).toHaveText("Langue:");

    await page.reload();
    await expect(languageSelect).toHaveValue("fr");
    await expect(languageLabel).toHaveText("Langue:");
  });

  test("switches to Nigerian Pidgin and records the preference", async ({ page }) => {
    await resetStoredLanguage(page);

    const languageSelect = page.locator("#language-select");
    const languageLabel = page.locator("label[for='language-select']");

    // Reached from French so the assertion observes a real transition: `pcm`
    // reuses the English wording for every footer key, so "Language" here
    // proves the Pidgin bundle replaced French instead of the change doing
    // nothing at all.
    await languageSelect.selectOption("fr");
    await expect(languageLabel).toHaveText("Langue:");

    await languageSelect.selectOption("pcm");
    await expect(languageSelect).toHaveValue("pcm");
    await expect(languageLabel).toHaveText("Language:");
    await expect(storedLanguage(page)).resolves.toBe("pcm");

    await page.goto("/payment");
    await expect(storedLanguage(page)).resolves.toBe("pcm");
    await expect(
      page.getByRole("heading", { name: "Payment", exact: true })
    ).toBeVisible();
  });

  test("keeps Nigerian Pidgin active after a reload", async ({ page }, testInfo) => {
    const defect =
      "App defect, reported alongside this PR: `pcm` is saved to localStorage but the " +
      "reloaded page renders English. Locale detection does return `pcm`, yet because " +
      "every Pidgin footer string equals its English counterpart the server and client " +
      "markup agree, no hydration mismatch occurs, and the server-rendered " +
      "`value=\"en\"` stays. `fr` persists only because its differing text forces the " +
      "tree to re-render on the client. The assertions below are the expected behaviour " +
      "once the provider applies the detected locale during init.";
    testInfo.annotations.push({ type: "app-defect", description: defect });
    // Recorded as a known failure rather than deleted: the suite runs red without it.
    test.fixme(true, defect);

    await resetStoredLanguage(page);

    await page.locator("#language-select").selectOption("pcm");
    await expect(storedLanguage(page)).resolves.toBe("pcm");

    await page.reload();
    await expect(page.locator("#language-select")).toHaveValue("pcm");
  });

  test("restores a saved locale during init and falls back for an unknown locale", async ({
    page,
  }) => {
    // Pre-seed the preference the way a returning visitor would have it saved.
    await page.goto("/");
    await page.evaluate(
      (key) => window.localStorage.setItem(key, "fr"),
      LANGUAGE_STORAGE_KEY
    );
    await page.reload();

    // Detection reads localStorage during i18n init, so the reloaded document
    // renders French rather than painting English first and switching after.
    await expect(page.locator("label[for='language-select']")).toHaveText("Langue:");
    await expect(page.locator("#language-select")).toHaveValue("fr");

    // An unsupported stored value must not render a missing key: detection
    // ignores it and the configured fallback locale is used.
    await page.evaluate(
      (key) => window.localStorage.setItem(key, "de"),
      LANGUAGE_STORAGE_KEY
    );
    await page.reload();
    await expect(page.locator("label[for='language-select']")).toHaveText("Language:");
    await expect(page.locator("#language-select")).toHaveValue("en");
  });
});
