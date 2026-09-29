import type { Dispute, Escrow, Subscription, Tracking } from "@/types";

type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function hasString(value: UnknownRecord, key: string): boolean {
  return typeof value[key] === "string";
}

function hasNumber(value: UnknownRecord, key: string): boolean {
  return typeof value[key] === "number" && !Number.isNaN(value[key]);
}

function isEscrowHistoryEvent(value: unknown): boolean {
  return isRecord(value) &&
    hasString(value, "id") &&
    hasString(value, "escrowId") &&
    hasString(value, "status") &&
    hasString(value, "timestamp") &&
    hasString(value, "description");
}

function isTrackingEvent(value: unknown): boolean {
  return isRecord(value) &&
    hasString(value, "id") &&
    hasString(value, "status") &&
    hasString(value, "location") &&
    hasString(value, "timestamp") &&
    hasString(value, "description");
}

export function isEscrow(value: unknown): value is Escrow {
  return isRecord(value) &&
    hasString(value, "id") &&
    hasString(value, "vendorId") &&
    hasNumber(value, "amount") &&
    hasString(value, "item") &&
    hasString(value, "status") &&
    hasString(value, "createdAt") &&
    hasString(value, "updatedAt") &&
    Array.isArray(value.history) && value.history.every(isEscrowHistoryEvent);
}

export function isDispute(value: unknown): value is Dispute {
  return isRecord(value) &&
    hasString(value, "id") &&
    hasString(value, "escrowId") &&
    isEscrow(value.escrow) &&
    hasString(value, "buyerId") &&
    hasString(value, "reason") &&
    Array.isArray(value.evidence) && value.evidence.every((item) => typeof item === "string") &&
    hasString(value, "status") &&
    hasString(value, "createdAt") &&
    hasString(value, "updatedAt");
}

export function isTracking(value: unknown): value is Tracking {
  return isRecord(value) &&
    hasString(value, "escrowId") &&
    hasString(value, "status") &&
    hasString(value, "carrier") &&
    hasString(value, "trackingNumber") &&
    Array.isArray(value.events) && value.events.every(isTrackingEvent);
}

export function isSubscription(value: unknown): value is Subscription {
  return isRecord(value) &&
    (value.plan === "FREE" || value.plan === "PRO") &&
    hasString(value, "vendorId");
}
