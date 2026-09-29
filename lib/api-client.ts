const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * Custom error class thrown by ApiClient when HTTP requests fail.
 * Contains the response HTTP status code and parsed body payload.
 */
export class ApiClientError extends Error {
  status: number;
  body?: unknown;

  /**
   * Constructs an ApiClientError.
   * @param status - The HTTP status code returned by the server.
   * @param message - Human-readable error message.
   * @param body - Optional parsed error payload.
   */
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.body = body;
  }
}

interface ApiClientOptions {
  token?: string | null;
  baseUrl?: string;
}

/**
 * Creates an API client instance with helper methods (get, post, patch, delete)
 * and built-in automatic retries for server errors.
 *
 * @param opts - Configuration options including authentication token and base URL.
 * @returns Object providing typed HTTP request methods.
 */
export function createApiClient(opts?: ApiClientOptions) {
  const baseUrl = opts?.baseUrl ?? API_URL;
  const token = opts?.token ?? undefined;

  async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers ?? {});
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    const url = `${baseUrl}${path}`;
    const maxRetries = 2;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const res = await fetch(url, { ...init, headers, cache: init.cache ?? "no-store" });

      if (res.ok) {
        const text = await res.text();
        return text ? (JSON.parse(text) as T) : (undefined as unknown as T);
      }

      if (res.status >= 500 && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
        continue;
      }

      const body = await res.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(body);
      } catch {
        parsed = body;
      }
      throw new ApiClientError(
        res.status,
        (parsed as Record<string, unknown>)?.message as string ?? (parsed as string) ?? res.statusText,
        parsed,
      );
    }

    throw new ApiClientError(500, "Request failed after retries");
  }

  return {
    get<T>(path: string): Promise<T> {
      return request<T>(path, { method: "GET" });
    },
    post<T>(path: string, body?: unknown): Promise<T> {
      return request<T>(path, {
        method: "POST",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    },
    patch<T>(path: string, body?: unknown): Promise<T> {
      return request<T>(path, {
        method: "PATCH",
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    },
    delete<T>(path: string): Promise<T> {
      return request<T>(path, { method: "DELETE" });
    },
  };
}
