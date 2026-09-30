import type { AuthChallengeResponse, AuthVerifyResponse } from '@/types/api';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not defined');
}

/**
 * Requests an authentication challenge transaction XDR for a given public key.
 *
 * @param publicKey - The Stellar public key to authenticate.
 * @returns Promise resolving to the challenge transaction XDR string.
 * @throws {Error} If the API request fails or returns a non-OK status.
 */
export async function getChallenge(publicKey: string): Promise<string> {
  try {
    const res = await fetch(`${API_URL}/auth/challenge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicKey }),
    });
    
    if (!res.ok) {
      const text = await res.text();
      let errorMessage = `Failed to get auth challenge (${res.status})`;
      try {
        const errorBody = JSON.parse(text);
        if (errorBody.message) {
          errorMessage = errorBody.message;
        }
      } catch {
        if (text) {
          errorMessage = text;
        }
      }
      throw new Error(errorMessage);
    }
    
    const text = await res.text();
    let data: AuthChallengeResponse;
    try {
      data = JSON.parse(text) as AuthChallengeResponse;
    } catch {
      throw new Error('Failed to parse auth challenge response: invalid JSON');
    }
    
    return data.transaction;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to get auth challenge: network error');
  }
}

/**
 * Submits a signed challenge transaction XDR for verification and returns a JWT authentication token.
 *
 * @param signedXdr - The signed transaction XDR string.
 * @returns Promise resolving to the authenticated JWT token string.
 * @throws {Error} If verification fails or returns a non-OK status.
 */
export async function verifyChallenge(signedXdr: string): Promise<string> {
  try {
    const res = await fetch(`${API_URL}/auth/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ xdr: signedXdr }),
    });
    
    if (!res.ok) {
      const text = await res.text();
      let errorMessage = `Failed to verify challenge (${res.status})`;
      try {
        const errorBody = JSON.parse(text);
        if (errorBody.message) {
          errorMessage = errorBody.message;
        }
      } catch {
        if (text) {
          errorMessage = text;
        }
      }
      throw new Error(errorMessage);
    }
    
    const text = await res.text();
    let data: AuthVerifyResponse;
    try {
      data = JSON.parse(text) as AuthVerifyResponse;
    } catch {
      throw new Error('Failed to parse verification response: invalid JSON');
    }
    
    return data.token;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to verify challenge: network error');
  }
}
