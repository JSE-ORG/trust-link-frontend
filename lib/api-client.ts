const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not defined');
}

export async function fetchEscrowData(escrowId: string) {
  try {
    const response = await fetch(`${API_URL}/escrow/${escrowId}`);
    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      throw new Error(`Request failed with status ${response.status}: ${errorBody}`);
    }
    return await parseJsonResponse(response);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch escrow data: ${error.message}`);
    }
    throw new Error('Failed to fetch escrow data');
  }
}

export async function submitEscrow(data: unknown) {
  try {
    const response = await fetch(`${API_URL}/escrow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'Unknown error');
      throw new Error(`Request failed with status ${response.status}: ${errorBody}`);
    }
    return await parseJsonResponse(response);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to submit escrow: ${error.message}`);
    }
    throw new Error('Failed to submit escrow');
  }
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return data;
    } catch {
      throw new Error(`Invalid JSON: ${text}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse response: ${error.message}`);
    }
    throw new Error('Failed to parse response');
  }
}

export function parseError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
    return String(error);
  }
  return 'Unknown error';
}