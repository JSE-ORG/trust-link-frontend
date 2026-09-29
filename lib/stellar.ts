import type { AuthChallengeResponse, AuthVerifyResponse } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Requests an authentication challenge transaction XDR for a given public key.
 *
 * @param publicKey - The Stellar public key to authenticate.
 * @returns Promise resolving to the challenge transaction XDR string.
 * @throws {Error} If the API request fails or returns a non-OK status.
 */
export async function getChallenge(publicKey: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/challenge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ publicKey }),
  });
  if (!res.ok) {
    throw new Error('Failed to get auth challenge');
  }
  const { transaction } = (await res.json()) as AuthChallengeResponse;
  return transaction;
}

/**
 * Submits a signed challenge transaction XDR for verification and returns a JWT authentication token.
 *
 * @param signedXdr - The signed transaction XDR string.
 * @returns Promise resolving to the authenticated JWT token string.
 * @throws {Error} If verification fails or returns a non-OK status.
 */
export async function verifyChallenge(signedXdr: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ xdr: signedXdr }),
  });
  if (!res.ok) {
    throw new Error('Failed to verify challenge');
  }
  const { token } = (await res.json()) as AuthVerifyResponse;
  return token;
}
