import { Dispute, Escrow } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function getEscrow(id: string): Promise<Escrow> {
  const res = await fetch(`${API_URL}/escrows/${id}`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch escrow');
  }
  return res.json();
}

export async function getDispute(id: string, token?: string): Promise<Dispute> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/disputes/${id}`, {
    cache: 'no-store',
    headers,
  });
  if (!res.ok) {
    throw new Error('Failed to fetch dispute');
  }
  return res.json();
}

export async function resolveDispute(id: string, resolution: 'RELEASE_TO_VENDOR' | 'REFUND_BUYER', token?: string): Promise<Dispute> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/disputes/${id}/resolve`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ resolution }),
  });
  if (!res.ok) {
    throw new Error('Failed to resolve dispute');
  }
  return res.json();
}
