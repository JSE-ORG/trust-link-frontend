import { expect, test } from "@playwright/test";

test.describe("clickjacking protection headers", () => {
  test("responses carry X-Frame-Options and a matching CSP frame-ancestors directive", async ({
    page,
  }) => {
    const response = await page.goto("/");
    expect(response).not.toBeNull();

    const headers = response!.headers();

    // Legacy clickjacking defence — blocks cross-origin framing of the app.
    expect(headers["x-frame-options"]).toBe("SAMEORIGIN");

    // Modern equivalent; must stay in lockstep with the header above.
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'self'");
  });
});
