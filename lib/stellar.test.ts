import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiConfigurationError, ApiNetworkError } from "./api/client";
import { getChallenge, verifyChallenge } from "./stellar";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

beforeEach(() => {
  vi.restoreAllMocks();
  process.env.NEXT_PUBLIC_API_URL = API_URL;
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

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(fetchCall[0]).toBe(`${API_URL}/auth/challenge`);
    expect(fetchCall[1]?.method).toBe("POST");
    expect(new Headers(fetchCall[1]?.headers).get("Content-Type")).toBe("application/json");
    expect(fetchCall[1]?.body).toBe(JSON.stringify({ publicKey: "GBAM5V6X2J7E3...K4L9M2N8P1" }));
  });

  it("throws an ApiError when the JSON response contains an error message", async () => {
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

  it("throws an ApiError when the response is plaintext", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response("Service Temporarily Unavailable", {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      }),
    );

    await expect(getChallenge("GBAM5V6X2J7E3...K4L9M2N8P1")).rejects.toThrow(
      "Service Temporarily Unavailable",
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
      /Invalid API response for \/auth\/challenge/,
    );
  });

  it("throws ApiNetworkError on network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new TypeError("Network error"),
    );

    await expect(getChallenge("GBAM5V6X2J7E3...K4L9M2N8P1")).rejects.toThrow(
      ApiNetworkError,
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
    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(fetchCall[0]).toBe(`${API_URL}/auth/challenge`);
    expect(fetchCall[1]?.body).toBe(JSON.stringify({ publicKey: "" }));
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

    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(fetchCall[0]).toBe(`${API_URL}/auth/verify`);
    expect(fetchCall[1]?.method).toBe("POST");
    expect(new Headers(fetchCall[1]?.headers).get("Content-Type")).toBe("application/json");
    expect(fetchCall[1]?.body).toBe(JSON.stringify({ xdr: "AAAAAgAAAABh...signedXdr" }));
  });

  it("throws an error when the plaintext response is not ok", async () => {
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

  it("throws an error when the JSON response contains an error message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(verifyChallenge("invalid-xdr")).rejects.toThrow(
      "Invalid signature",
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
      /Invalid API response for \/auth\/verify/,
    );
  });

  it("throws ApiNetworkError on network failure", async () => {
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(
      new TypeError("Network error"),
    );

    await expect(verifyChallenge("signed-xdr")).rejects.toThrow(ApiNetworkError);
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
    const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(fetchCall[0]).toBe(`${API_URL}/auth/verify`);
    expect(fetchCall[1]?.body).toBe(JSON.stringify({ xdr: "" }));
  });
});

describe("environment configuration and module import", () => {
  it("does not require NEXT_PUBLIC_API_URL on module import, and throws ApiConfigurationError on request", async () => {
    const originalUrl = process.env.NEXT_PUBLIC_API_URL;
    delete process.env.NEXT_PUBLIC_API_URL;

    try {
      await expect(getChallenge("pubkey")).rejects.toThrow(ApiConfigurationError);
      await expect(verifyChallenge("xdr")).rejects.toThrow(ApiConfigurationError);
    } finally {
      process.env.NEXT_PUBLIC_API_URL = originalUrl;
    }
  });
});
