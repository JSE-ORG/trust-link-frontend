import { handleSessionExpired } from "@/hooks/useWallet";
import type {
  VendorAnalyticsApiResponse,
  VendorAnalyticsResponse,
  VendorNotificationPreferences,
} from "@/types";
import type {
  ApiErrorResponse,
  CancelEscrowResponse,
  CreateDisputeResponse,
  CreateEscrowResponse,
  EmptyResponse,
  GetDisputeResponse,
  GetDisputesResponse,
  GetEscrowResponse,
  GetPublicVendorEscrowsResponse,
  GetSubscriptionResponse,
  GetTrackingResponse,
  GetVendorAnalyticsApiResponse,
  GetVendorAnalyticsResponse,
  GetVendorEscrowsResponse,
  GetVendorNotificationPreferencesResponse,
  GetVendorProfileResponse,
  ResolveDisputeResponse,
  ShipEscrowResponse,
  UpgradeSubscriptionResponse,
} from "@/types/api";
import {
  isDispute,
  isEscrow,
  isSubscription,
  isTracking,
} from "@/types/guards";
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { SESSION_EXPIRED_EVENT, handleSessionExpired } from '../auth/constants';

const api = axios.create({ baseURL: process.env.NEXT_PUBLIC_API_URL });

export async function apiRequest<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const json = JSON.parse(body) as ApiErrorResponse;
    return new ApiError(res.status, json.message || json.error || json.details || res.statusText, json);
  } catch {
    return new ApiError(res.status, body || res.statusText, undefined);
  }
}

type ResponseGuard<T> = (value: unknown) => value is T;

async function request<T>(
  path: string,
  init: RequestInit = {},
  token?: string,
  validate?: ResponseGuard<T>
): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(`${API_URL}${path}`, { ...init, headers, cache: init.cache ?? "no-store" });
  if (!res.ok) {
    if (res.status === 401 && token && typeof window !== "undefined") {
      handleSessionExpired();
    }
    throw await parseError(res);
  }

  const text = await res.text();
  let response: unknown;
  try {
    response = text ? JSON.parse(text) : undefined;
  } catch {
    throw new Error(`Invalid API response for ${path}: malformed JSON`);
  }
  if (validate && !validate(response)) {
    throw new Error(`Invalid API response for ${path}: unexpected response shape`);
  }

  return response as T;
}

export function normalizeVendorAnalyticsResponse(
  response: VendorAnalyticsApiResponse
): VendorAnalyticsResponse {
  return {
    ...response,
    dataPoints: response.dailyMetrics ?? response.series ?? response.data ?? [],
  };
}

/**
 * Creates a new escrow payment request.
 *
 * @param data - Input parameters including item name, price in USDC, description, and shipping window.
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to the created escrow response.
 */
export async function createEscrow(data: EscrowInput, token?: string): Promise<CreateEscrowResponse> {
  return request<CreateEscrowResponse>("/escrow", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }, token);
}

/**
 * Fetches escrow details by ID. Falls back to `/escrows/{id}` if `/escrow/{id}` returns 404.
 *
 * @param id - The unique escrow ID.
 * @param token - Optional Bearer auth token.
 * @returns Promise resolving to the escrow details.
 */
export async function getEscrow(id: string, token?: string): Promise<GetEscrowResponse> {
  try {
    return await request<GetEscrowResponse>(`/escrow/${id}`, {}, token, isEscrow);
    const response: AxiosResponse<T> = await api(config);
    return response.data;
  } catch (error) {
    if (error instanceof AxiosError && error.response?.status === 401) {
      handleSessionExpired();
    }
    throw error;
  }
}

export function setupInterceptors(): void {
  api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
      if (error.response?.status === 401) {
        handleSessionExpired();
      }
      return Promise.reject(error);
    }
  );
}
