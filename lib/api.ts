import { Dispute, Escrow, Subscription, Tracking } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function getEscrow(id: string): Promise<Escrow> {
  const primaryRes = await fetch(`${API_URL}/escrow/${id}`, {
    cache: 'no-store',
  });

  if (primaryRes.ok) {
    return primaryRes.json();
  }

  const fallbackRes = await fetch(`${API_URL}/escrows/${id}`, {
    cache: 'no-store',
  });

  if (!fallbackRes.ok) {
    throw new Error('Failed to fetch escrow');
  }

  return fallbackRes.json();
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

export async function getAdminDisputes(token?: string): Promise<Dispute[]> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/disputes?status=OPEN,UNDER_REVIEW`, {
    cache: 'no-store',
    headers,
  });
  if (!res.ok) {
    throw new Error('Failed to fetch disputes');
  }

  const disputes = (await res.json()) as Dispute[];
  return disputes.filter(
    (dispute) => dispute.status === 'OPEN' || dispute.status === 'UNDER_REVIEW'
  );
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

export interface EscrowInput {
  itemName: string;
  priceUSDC: string;
  description: string;
  shippingWindow: string;
}

export interface EscrowResponse {
  url: string;
}

export async function createEscrow(data: EscrowInput): Promise<EscrowResponse> {
  const res = await fetch(`${API_URL}/escrow`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to create escrow: ${err}`);
  }
  return res.json();
}

export async function getVendorEscrows(token?: string): Promise<Escrow[]> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/vendor/escrows`, {
    cache: 'no-store',
    headers,
  });
  if (!res.ok) {
    throw new Error('Failed to fetch vendor escrows');
  }
  return res.json();
}

export async function createDispute(escrowId: string, data: { reason: string; description: string; evidence: string[] }): Promise<Dispute> {
  const res = await fetch(`${API_URL}/escrows/${escrowId}/dispute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to raise dispute: ${err}`);
  }
  return res.json();
}

export async function getTracking(escrowId: string): Promise<Tracking> {
  const res = await fetch(`${API_URL}/escrows/${escrowId}/tracking`, {
    cache: 'no-store',
  });
  if (!res.ok) {
    throw new Error('Failed to fetch tracking details');
  }
  return res.json();
}

export async function getSubscription(token?: string): Promise<Subscription> {
  const headers: HeadersInit = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}/subscription`, {
    cache: 'no-store',
    headers,
  });
  if (!res.ok) {
    throw new Error('Failed to fetch subscription');
  }
  return res.json();
}

export async function upgradeSubscription(token?: string): Promise<Subscription> {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${API_URL}/subscription/upgrade`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Upgrade failed: ${err}`);
  }
  return res.json();
}

export interface BuyerContactInput {
  email?: string;
  phone?: string;
}

export interface VendorNotificationPreferences {
  funded:    { email: boolean; sms: boolean };
  shipped:   { email: boolean; sms: boolean };
  delivered: { email: boolean; sms: boolean };
  disputed:  { email: boolean; sms: boolean };
  completed: { email: boolean; sms: boolean };
}

export async function getVendorNotificationPreferences(
  token: string
): Promise<VendorNotificationPreferences> {
  const res = await fetch(`${API_URL}/vendor/notifications`, {
    cache: 'no-store',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error('Failed to fetch notification preferences');
  return res.json();
}

export async function patchVendorNotifications(
  prefs: VendorNotificationPreferences,
  token: string
): Promise<void> {
  const res = await fetch(`${API_URL}/vendor/notifications`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(prefs),
  });
  if (!res.ok) throw new Error('Failed to save notification preferences');
}

export async function patchBuyerContact(escrowId: string, data: BuyerContactInput): Promise<void> {
  const res = await fetch(`${API_URL}/escrow/${escrowId}/buyer-contact`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Failed to save contact info: ${err}`);
  }
}

export interface VendorAnalyticsPoint {
  date: string;
  transactionVolume: number;
  averageOrderValue: number;
  completionRate: number;
  disputeRate: number;
}

export interface VendorAnalyticsResponse {
  totalTransactionVolume?: number;
  averageOrderValue?: number;
  completionRate?: number;
  disputeRate?: number;
  periodLabel?: string;
  generatedAt?: string;
  dailyMetrics?: VendorAnalyticsPoint[];
  series?: VendorAnalyticsPoint[];
  data?: VendorAnalyticsPoint[];
}

export async function getVendorAnalytics(token?: string): Promise<VendorAnalyticsResponse> {
  const headers: HeadersInit = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}/vendor/analytics`, {
    cache: "no-store",
    headers,
  });

  if (!res.ok) {
    throw new Error("Failed to fetch vendor analytics");
  }

  return res.json();
}
