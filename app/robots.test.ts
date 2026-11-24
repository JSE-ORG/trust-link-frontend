import { describe, expect, it } from "vitest";

import robots from "./robots";

describe("robots", () => {
  it("disallows the internal visual test routes while allowing the rest of the site", () => {
    const rules = robots().rules as {
      userAgent: string;
      allow: string;
      disallow: string[];
    };

    expect(rules.allow).toBe("/");
    expect(rules.disallow).toEqual(["/badge-visual-test", "/dispute-form-test"]);
  });
});
