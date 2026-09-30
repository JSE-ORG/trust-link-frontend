const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL environment variable is not defined');
}

export const apiClient = {
  get: async <T>(endpoint: string): Promise<T> => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`);
      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unknown error');
        throw new Error(`Request failed with status ${response.status}: ${errorBody}`);
      }
      return await parseResponse<T>(response);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Network error: ${error.message}`);
      }
      throw new Error('Unknown network error');
    }
  },
  post: async <T>(endpoint: string, body: unknown): Promise<T> => {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unknown error');
        throw new Error(`Request failed with status ${response.status}: ${errorBody}`);
      }
      return await parseResponse<T>(response);
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Network error: ${error.message}`);
      }
      throw new Error('Unknown network error');
    }
  },
};

async function parseResponse<T>(response: Response): Promise<T> {
  try {
    const data = await response.json();
    return data as T;
  } catch (error) {
    const text = await response.text().catch(() => 'No response body');
    try {
      const parsed = JSON.parse(text);
      if (typeof parsed === 'object' && parsed !== null && 'message' in parsed) {
        throw new Error(String(parsed.message));
      }
      throw new Error(`Invalid JSON: ${text}`);
    } catch {
      throw new Error(`Invalid response: ${text}`);
    }
  }
}