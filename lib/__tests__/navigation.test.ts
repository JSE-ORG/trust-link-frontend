import { describe, expect, it } from "vitest";

import { CORE_NAV, isNavigationActive } from "@/lib/navigation";

describe("isNavigationActive", () => {
  describe("exact matches", () => {
    it.each(CORE_NAV.map((item) => item.href))("matches the exact route %s", (href) => {
      expect(isNavigationActive(href, href)).toBe(true);
    });
  });

  describe("nested subroutes", () => {
    it.each([
      ["/dashboard/analytics", "/dashboard"],
      ["/dashboard/analytics/revenue", "/dashboard"],
      ["/create/review", "/create"],
      ["/notifications/42", "/notifications"],
      ["/tracking/history", "/tracking"],
    ])("matches %s against its parent %s", (pathname, href) => {
      expect(isNavigationActive(pathname, href)).toBe(true);
    });

    it("does not match a nested route against the child segment", () => {
      expect(isNavigationActive("/dashboard/analytics", "/analytics")).toBe(false);
    });
  });

  describe("tracking detail routes", () => {
    it("maps a /track/... detail page onto the tracking tab", () => {
      expect(isNavigationActive("/track/escrow-123", "/tracking")).toBe(true);
      expect(isNavigationActive("/track/escrow-123/events", "/tracking")).toBe(true);
    });

    it("only applies the /track/... mapping to the tracking tab", () => {
      expect(isNavigationActive("/track/escrow-123", "/dashboard")).toBe(false);
      expect(isNavigationActive("/track/escrow-123", "/profile")).toBe(false);
    });

    it("does not treat the legacy bare /track path as the tracking tab", () => {
      expect(isNavigationActive("/track", "/tracking")).toBe(false);
    });

    it("does not treat lookalike prefixes as the tracking tab", () => {
      expect(isNavigationActive("/trackings", "/tracking")).toBe(false);
      expect(isNavigationActive("/tracker", "/tracking")).toBe(false);
    });
  });

  describe("profile settings routes", () => {
    it.each([
      "/settings/profile",
      "/settings/profile/business",
      "/settings/profile/payouts",
    ])("maps %s onto the profile tab", (pathname) => {
      expect(isNavigationActive(pathname, "/profile")).toBe(true);
    });

    it("only applies the settings mapping to the profile tab", () => {
      expect(isNavigationActive("/settings/profile", "/dashboard")).toBe(false);
      expect(isNavigationActive("/settings/profile", "/notifications")).toBe(false);
    });

    it("does not match sibling settings routes or lookalike prefixes", () => {
      expect(isNavigationActive("/settings", "/profile")).toBe(false);
      expect(isNavigationActive("/settings/profiles", "/profile")).toBe(false);
      expect(isNavigationActive("/settings/profile-old", "/profile")).toBe(false);
    });
  });

  describe("negative cases", () => {
    it("returns false for unrelated routes", () => {
      expect(isNavigationActive("/vendor/123", "/dashboard")).toBe(false);
      expect(isNavigationActive("/dashboard", "/profile")).toBe(false);
      expect(isNavigationActive("/notifications", "/create")).toBe(false);
    });

    it("requires a path segment boundary rather than a raw prefix", () => {
      expect(isNavigationActive("/dashboards", "/dashboard")).toBe(false);
      expect(isNavigationActive("/create-x", "/create")).toBe(false);
      expect(isNavigationActive("/notifications-archive", "/notifications")).toBe(false);
    });

    it("returns false for a null pathname", () => {
      expect(isNavigationActive(null, "/dashboard")).toBe(false);
      expect(isNavigationActive(null, "/tracking")).toBe(false);
    });

    it("returns false for an empty pathname", () => {
      expect(isNavigationActive("", "/dashboard")).toBe(false);
      expect(isNavigationActive("", "")).toBe(false);
    });
  });
});

describe("CORE_NAV", () => {
  it("exposes the five shared desktop and mobile destinations in order", () => {
    expect(CORE_NAV.map((item) => item.href)).toEqual([
      "/dashboard",
      "/create",
      "/tracking",
      "/notifications",
      "/profile",
    ]);
  });

  it("gives every destination a label, an icon, and an absolute href", () => {
    for (const item of CORE_NAV) {
      expect(item.href.startsWith("/")).toBe(true);
      expect(item.label.trim().length).toBeGreaterThan(0);
      expect(item.icon).toBeDefined();
    }
  });

  it("does not contain duplicate destinations", () => {
    const hrefs = CORE_NAV.map((item) => item.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });
});
