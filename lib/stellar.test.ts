import { beforeEach,describe, expect, it, vi } from "vitest";

import { getChallenge, verifyChallenge } from "./stellar";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("getChallenge", () => {
  it("returns the transaction string on success", async () => {
    const mockTransaction = "AAAAAgAAAABh...";
    const response = new Response(JSON.stringify({ transaction: mockTransaction }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    const readBody = vi.spyOn(response, "text");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(response);

    const result = await getChallenge("GBAM5V6X2J7E3...K4L9M2N8P1");

    expect(result).toBe(mockTransaction);
    expect(readBody).toHaveBeenCalledOnce();
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
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Challenge rejected" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(getChallenge("GBAM5V6X2J7E3...K4L9M2N8P1")).rejects.toThrow(
      "Challenge rejected",
    );
  });

  it("rejects malformed successful JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("{invalid json", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(getChallenge("GABC123")).rejects.toThrow(
      "Failed to parse auth challenge response: invalid JSON",
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
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ transaction: "tx-empty-key" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

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
    const response = new Response(JSON.stringify({ token: mockToken }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
    const readBody = vi.spyOn(response, "text");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(response);

    const result = await verifyChallenge("AAAAAgAAAABh...signedXdr");

    expect(result).toBe(mockToken);
    expect(readBody).toHaveBeenCalledOnce();
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
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Verification service unavailable", {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      }),
    );

    await expect(verifyChallenge("invalid-xdr")).rejects.toThrow(
      "Verification service unavailable",
    );
  });

  it("rejects malformed successful JSON", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("not-json", {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(verifyChallenge("signed-xdr")).rejects.toThrow(
      "Failed to parse verification response: invalid JSON",
    );
  });

  it("throws on network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new TypeError("Network error"),
    );

    await expect(verifyChallenge("signed-xdr")).rejects.toThrow(TypeError);
  });

  it("handles empty signed XDR gracefully", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ token: "token-from-empty-xdr" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

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