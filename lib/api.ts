import { Dispute, Escrow } from "@/types";
import { EscrowInput, EscrowResponse } from "@/types/escrow";

export type DisputeResolution = "RELEASE_TO_VENDOR" | "REFUND_BUYER";

export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
}

export function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as ApiError).status === "number" &&
    typeof (value as ApiError).message === "string"
  );
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
let authToken: string | null = null;

export function setApiToken(token: string | null) {
  authToken = token;
}

function buildHeaders(initial?: HeadersInit, body?: BodyInit, token?: string): HeadersInit {
  const merged = new Headers(initial);
  const bearer = token ?? authToken;
  if (bearer) {
    merged.set("Authorization", `Bearer ${bearer}`);
  }

  if (body instanceof FormData) {
    return merged;
  }

  if (body !== undefined && !merged.has("Content-Type")) {
    merged.set("Content-Type", "application/json");
  }

  return merged;
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function createApiError(status: number, message: string, details?: unknown): ApiError {
  return { status, message, details };
}

async function request<T>(path: string, options: RequestInit = {}, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.headers, options.body, token),
  });

  const parsed = await parseResponse(response);
  if (!response.ok) {
    const message =
      typeof parsed === "object" && parsed !== null && "message" in parsed
        ? String((parsed as any).message)
        : String(parsed ?? response.statusText ?? "Request failed");

    throw createApiError(response.status, message, parsed);
  }

  return parsed as T;
}

export function createApiClient(token?: string) {
  return {
    getEscrow: (id: string) => request<Escrow>(`/escrows/${id}`, { cache: "no-store" }, token),
    createEscrow: (data: EscrowInput) => request<EscrowResponse>(`/escrow`, {
      method: "POST",
      body: JSON.stringify(data),
    }, token),
    shipEscrow: (escrowId: string, trackingId: string, carrier = "Other") =>
      request<Escrow>(`/escrow/${escrowId}/ship`, {
        method: "PATCH",
        body: JSON.stringify({ trackingId, carrier }),
      }, token),
    confirmDelivery: (escrowId: string) =>
      request<Escrow>(`/escrows/${escrowId}/confirm`, { method: "POST" }, token),
    createDispute: (formData: FormData) =>
      request<Dispute>(`/dispute`, { method: "POST", body: formData }, token),
    getDispute: (id: string) => request<Dispute>(`/disputes/${id}`, { cache: "no-store" }, token),
    resolveDispute: (id: string, resolution: DisputeResolution) =>
      request<Dispute>(`/disputes/${id}/resolve`, {
        method: "PATCH",
        body: JSON.stringify({ resolution }),
      }, token),
    getVendorEscrows: () => request<Escrow[]>(`/vendor/escrows`, { cache: "no-store" }, token),
  };
}

export async function getEscrow(id: string): Promise<Escrow> {
  return request<Escrow>(`/escrows/${id}`, { cache: "no-store" });
}

export async function createEscrow(data: EscrowInput): Promise<EscrowResponse> {
  return request<EscrowResponse>(`/escrow`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function shipEscrow(escrowId: string, trackingId: string, carrier = "Other"): Promise<Escrow> {
  return request<Escrow>(`/escrow/${escrowId}/ship`, {
    method: "PATCH",
    body: JSON.stringify({ trackingId, carrier }),
  });
}

export async function confirmDelivery(escrowId: string): Promise<Escrow> {
  return request<Escrow>(`/escrows/${escrowId}/confirm`, { method: "POST" });
}

export async function createDispute(formData: FormData): Promise<Dispute> {
  return request<Dispute>(`/dispute`, { method: "POST", body: formData });
}

export async function getDispute(id: string): Promise<Dispute> {
  return request<Dispute>(`/disputes/${id}`, { cache: "no-store" });
}

export async function resolveDispute(id: string, resolution: DisputeResolution): Promise<Dispute> {
  return request<Dispute>(`/disputes/${id}/resolve`, {
    method: "PATCH",
    body: JSON.stringify({ resolution }),
  });
}

export async function getVendorEscrows(): Promise<Escrow[]> {
  return request<Escrow[]>(`/vendor/escrows`, { cache: "no-store" });
}
