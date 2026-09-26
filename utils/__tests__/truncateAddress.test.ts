import { describe, expect, it } from "vitest";

import { truncateAddress } from "../truncateAddress";

describe("truncateAddress", () => {
  it("truncates standard-length Stellar addresses", () => {
    const address = "GABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDE";
    expect(truncateAddress(address)).toBe("GABC...BCDE");
  });

  it("does not truncate short strings", () => {
    const address = "GABC1234";
    expect(truncateAddress(address)).toBe("GABC1234");
  });

  it("handles empty strings gracefully", () => {
    expect(truncateAddress("")).toBe("");
  });

  it("handles undefined inputs gracefully", () => {
    expect(truncateAddress(undefined as unknown as string)).toBe("");
  });

  it("truncates with custom startChars and endChars", () => {
    const address = "GABCDEFGHIJKLMNOPQRSTUVWXYZABCDEFGHIJKLMNOPQRSTUVWXYZABCDE";
    expect(truncateAddress(address, 2, 2)).toBe("GA...DE");
  });
});
