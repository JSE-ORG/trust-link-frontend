import { expect, test } from "@playwright/test";

test("falls back to the cached offline page and recovers when connectivity returns", async ({
  browser,
  baseURL,
}) => {
  if (!baseURL) throw new Error("Playwright baseURL is required for the service worker test");

  const context = await browser.newContext({ serviceWorkers: "allow" });
  const page = await context.newPage();
  const origin = new URL(baseURL);
  const uncachedPath = `/offline-navigation-uncached-${Date.now()}`;

  try {
    await page.goto(new URL("/offline", origin).toString());
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

    const installedWorker = await page.evaluate(async (path) => {
      const registration = await navigator.serviceWorker.ready;
      const offlineDocument = await caches.match("/offline");
      return {
        workerUrl: registration.active?.scriptURL,
        offlineHtml: offlineDocument ? await offlineDocument.text() : null,
        uncachedDocument: await caches.match(
          new URL(path, location.origin).toString(),
        ),
      };
    }, uncachedPath);

    expect(installedWorker.workerUrl).toBe(new URL("/sw.js", origin).toString());
    expect(installedWorker.offlineHtml).toContain("You are offline");
    expect(installedWorker.uncachedDocument).toBeUndefined();

    await context.setOffline(true);
    const offlineResponse = await page.goto(new URL(uncachedPath, origin).toString());
    expect(offlineResponse?.status()).toBe(200);
    await expect(page.getByRole("heading", { name: "You are offline" })).toBeVisible();

    await context.setOffline(false);
    await page.goto(origin.toString());
    await expect(
      page.getByRole("heading", { name: /Secure Escrow for Every Transaction/ }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "You are offline" })).toHaveCount(0);
  } finally {
    await context.close();
  }
});