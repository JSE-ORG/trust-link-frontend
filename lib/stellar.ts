import { request } from "@/lib/api/client";
import type { AuthChallengeResponse, AuthVerifyResponse } from "@/types/api";

/**
 * Requests an authentication challenge transaction XDR for a given public key.
 *
 * Uses the canonical HTTP client transport for lazy URL configuration and centralized error parsing.
 *
 * @param publicKey - The Stellar public key to authenticate.
 * @returns Promise resolving to the challenge transaction XDR string.
 * @throws {ApiConfigurationError} If NEXT_PUBLIC_API_URL is missing.
 * @throws {ApiNetworkError} If the network request fails.
 * @throws {ApiError} If the API request fails or returns a non-OK status.
 */
export async function getChallenge(publicKey: string): Promise<string> {
  const data = await request<AuthChallengeResponse>("/auth/challenge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicKey }),
  });

  return data.transaction;
}

/**
 * Submits a signed challenge transaction XDR for verification and returns a JWT authentication token.
 *
 * Uses the canonical HTTP client transport for lazy URL configuration and centralized error parsing.
 *
 * @param signedXdr - The signed transaction XDR string.
 * @returns Promise resolving to the authenticated JWT token string.
 * @throws {ApiConfigurationError} If NEXT_PUBLIC_API_URL is missing.
 * @throws {ApiNetworkError} If the network request fails.
 * @throws {ApiError} If verification fails or returns a non-OK status.
 */
export async function verifyChallenge(signedXdr: string): Promise<string> {
  const data = await request<AuthVerifyResponse>("/auth/verify", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ xdr: signedXdr }),
  });

  return data.token;
}
