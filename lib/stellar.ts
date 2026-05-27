const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function getChallenge(publicKey: string): Promise<string> {
  const res = await fetch(`${API_URL}/auth/challenge?publicKey=${publicKey}`);
  if (!res.ok) {
    throw new Error('Failed to get auth challenge');
  }
  const { transaction } = await res.json();
  return transaction;
}

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
  const { token } = await res.json();
  return token;
}
