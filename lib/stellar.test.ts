import { beforeEach,describe, expect, it, vi } from "vitest";

import { getChallenge, verifyChallenge } from "./stellar";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("getChallenge", () => {
  it("returns the transaction string on success", async () => {
    const mockTransaction = "AAAAAgAAAABh...";
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ transaction: mockTransaction }),
    } as Response);

    const result = await getChallenge("GBAM5V6X2J7E3...K4L9M2N8P1");

    expect(result).toBe(mockTransaction);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${API_URL}/auth/challenge`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicKey: "GBAM5V6X2J7E3...K4L9M2N8P1" }),
      }),
    );
  });

  it("throws an error when the response is not ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
    } as Response);

    await expect(getChallenge("GBAM5V6X2J7E3...K4L9M2N8P1")).rejects.toThrow(
      "Failed to get auth challenge",
    );
  });

  it("throws on network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new TypeError("Network error"),
    );

    await expect(getChallenge("GBAM5V6X2J7E3...K4L9M2N8P1")).rejects.toThrow(
      TypeError,
    );
  });

  it("handles empty public key gracefully", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ transaction: "tx-empty-key" }),
    } as Response);

    const result = await getChallenge("");

    expect(result).toBe("tx-empty-key");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${API_URL}/auth/challenge`,
      expect.objectContaining({
        body: JSON.stringify({ publicKey: "" }),
      }),
    );
  });
});

describe("verifyChallenge", () => {
  it("returns the JWT token on success", async () => {
    const mockToken = "eyJhbGciOiJIUzI1NiIs...";
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: mockToken }),
    } as Response);

    const result = await verifyChallenge("AAAAAgAAAABh...signedXdr");

    expect(result).toBe(mockToken);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${API_URL}/auth/verify`,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xdr: "AAAAAgAAAABh...signedXdr" }),
      }),
    );
  });

  it("throws an error when the response is not ok", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
    } as Response);

    await expect(verifyChallenge("invalid-xdr")).rejects.toThrow(
      "Failed to verify challenge",
    );
  });

  it("throws on network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new TypeError("Network error"),
    );

    await expect(verifyChallenge("signed-xdr")).rejects.toThrow(TypeError);
  });

  it("handles empty signed XDR gracefully", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "token-from-empty-xdr" }),
    } as Response);

    const result = await verifyChallenge("");

    expect(result).toBe("token-from-empty-xdr");
    expect(globalThis.fetch).toHaveBeenCalledWith(
      `${API_URL}/auth/verify`,
      expect.objectContaining({
        body: JSON.stringify({ xdr: "" }),
      }),
    );
  });
});