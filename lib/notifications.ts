import type { AppNotification, Escrow } from "@/types";

const STORAGE_KEY = "notifications.read";

export function deriveNotifications(escrows: Escrow[]): Omit<AppNotification, "read">[] {
  const notifications: Omit<AppNotification, "read">[] = [];

  for (const escrow of escrows) {
    for (const event of escrow.history ?? []) {
      notifications.push({
        id: event.id,
        escrowId: escrow.id,
        escrowItem: escrow.item,
        type: event.status,
        message: event.description,
        timestamp: event.timestamp,
      });
    }
  }

  return notifications.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

export function getReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveReadIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Escrow created",
  FUNDED: "Payment received",
  SHIPPED: "Order shipped",
  COMPLETED: "Order completed",
  DISPUTED: "Dispute raised",
  RELEASED: "Funds released",
  REFUNDED: "Refund processed",
  EXPIRED: "Escrow expired",
};

export function statusLabel(type: string): string {
  return STATUS_LABELS[type] ?? type;
}

export function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
