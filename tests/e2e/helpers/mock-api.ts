import { Page } from "@playwright/test";
import { NextFixture } from "next/experimental/testmode/playwright";

import type { EscrowInput } from "@/lib/api";
import type { Dispute, Escrow } from "@/types";

import disputesFixture from "../fixtures/disputes.json";
import escrowsFixture from "../fixtures/escrows.json";

/**
 * Per-options-object bookkeeping for the admin resolve-dispute flow.
 * `next.onFetch` handlers are called in reverse registration order and the
 * first non-undefined result wins, so per-test custom handlers that return
 * `"continue"` short-circuit straight to the real network. Instead of layering
 * more handlers on top, stateful behaviour like "the disputes list empties once
 * the dispute is resolved" lives in the options and is tracked here.
 */
const adminResolveStates = new WeakMap<object, { resolved: boolean }>();

async function getAsyncMockResponse(
  pathname: string,
  method: string,
  options?: MockApiOptions
): Promise<{ status: number; body: unknown } | null> {
  const resolve = options?.adminResolveDispute;
  // resolveDispute PATCHes /disputes/:id/resolve.
  if (!resolve || method !== "PATCH") {
    return null;
  }
  if (!pathname.includes(`/disputes/${resolve.disputeId}/resolve`)) {
    return null;
  }

  if (resolve.delayMs) {
    await new Promise((r) => setTimeout(r, resolve.delayMs));
  }
  adminResolveStates.set(options, { resolved: true });

  return {
    status: 200,
    body: {
      ...options.mockDispute,
      ...disputesFixture.resolveDispute,
      // The resolution settles the escrow funds too, mirroring the admin UI's
      // optimistic RELEASED/REFUNDED badge state.
      escrow: {
        ...(options.mockDispute?.escrow ?? {}),
        status: "RELEASED",
      },
    },
  };
}

function isAdminDisputeResolved(options?: MockApiOptions): boolean {
  if (!options) return false;
  return adminResolveStates.get(options)?.resolved ?? false;
}

/**
 * Issue #426 — fixtures are typed against the real domain models instead of
 * `Record<string, unknown>`, so a mock that drifts from the API schema (a wrong
 * `status` literal, a renamed field) fails type-check rather than silently
 * rendering a screen the production app could never receive.
 *
 * They stay `Partial` on purpose: a spec should only declare the fields the
 * screen under test reads, not a full escrow every time.
 */
export type MockEscrow = Partial<Escrow>;

/** `escrow` is re-declared so a nested escrow fixture can be partial too. */
export type MockDispute = Partial<Omit<Dispute, "escrow">> & {
  escrow?: MockEscrow;
};

export interface MockApiOptions {
  escrowId?: string;
  mockEscrow?: MockEscrow;
  mockDispute?: MockDispute;
  mockEscrowsList?: MockEscrow[];
  mockDisputesList?: MockDispute[];
  /** When true, POST /escrows/:id/dispute responds 500 (dispute-flow error toast test). */
  disputePostError?: boolean;
  /**
   * Admin resolve-dispute flow. POST /disputes/:id/resolve succeeds (after an
   * optional delay), the nested escrow flips to RELEASED, and subsequent
   * GET /disputes responses become empty so the admin queue empties.
   */
  adminResolveDispute?: { disputeId: string; delayMs?: number };
}

export function setupNextOnFetch(next: NextFixture, options?: MockApiOptions) {
  next.onFetch(async (request) => {
    const url = new URL(request.url);
    const asyncMock = await getAsyncMockResponse(url.pathname, request.method, options);
    if (asyncMock) {
      return new Response(JSON.stringify(asyncMock.body), {
        status: asyncMock.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    const mock = getMockResponse(url.pathname, request.method, options);
    if (mock) {
      return new Response(JSON.stringify(mock.body), {
        status: mock.status,
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Create Escrow special case (requires reading request body)
    if (url.pathname.endsWith("/escrow") && request.method === "POST") {
      let payload: Partial<EscrowInput> = {};
      try {
        const body = await request.clone().text();
        if (body) payload = JSON.parse(body) as Partial<EscrowInput>;
      } catch {
        // ignore JSON parse error
      }
      return new Response(
        JSON.stringify({
          url: `https://trustlink.example.com/escrow/${encodeURIComponent(
            payload.itemName || "ESCROW-12345"
          )}`,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    
    return "continue";
  });
}

export async function setupNetworkMocks(page: Page, next: NextFixture, options?: MockApiOptions) {
  // 1. Setup SSR Mocks using next.onFetch (for Node.js fetches)
  setupNextOnFetch(next, options);
  
  // 2. Setup CSR Mocks using page.route (for Browser fetches)
  await page.route("**/api/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const asyncMock = await getAsyncMockResponse(url.pathname, request.method(), options);
    
    if (asyncMock) {
      return route.fulfill({
        status: asyncMock.status,
        contentType: "application/json",
        body: JSON.stringify(asyncMock.body),
      });
    }
    
    const mock = getMockResponse(url.pathname, request.method(), options);
    
    if (mock) {
      return route.fulfill({
        status: mock.status,
        contentType: "application/json",
        body: JSON.stringify(mock.body),
      });
    }
    
    // Create Escrow special case
    if (url.pathname.endsWith("/escrow") && request.method() === "POST") {
      let payload: Partial<EscrowInput> = {};
      try {
        const postData = request.postData();
        if (postData) payload = JSON.parse(postData) as Partial<EscrowInput>;
      } catch {
        // ignore JSON parse error
      }
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          url: `https://trustlink.example.com/escrow/${encodeURIComponent(
            payload.itemName || "ESCROW-12345"
          )}`,
        }),
      });
    }

    return route.continue();
  });
}

function getMockResponse(pathname: string, method: string, options?: MockApiOptions) {
  // Auth
  if (pathname.includes("/auth/challenge")) {
    return { status: 200, body: escrowsFixture.authChallenge };
  }
  if (pathname.includes("/auth/verify")) {
    return { status: 200, body: escrowsFixture.authVerify };
  }

  // Single Escrow (GET/POST/PUT)
  if (
    options?.escrowId &&
    (pathname.endsWith(`/escrow/${options.escrowId}`) ||
      pathname.endsWith(`/escrows/${options.escrowId}`))
  ) {
    return { status: 200, body: options.mockEscrow };
  }

  // Patch Buyer Contact
  if (
    options?.escrowId && 
    (pathname.includes(`/escrows/${options.escrowId}/buyer-contact`) || 
     pathname.includes(`/escrow/${options.escrowId}/buyer-contact`))
  ) {
    return { status: 200, body: options.mockEscrow };
  }

  // Fund Escrow
  if (options?.escrowId && pathname.includes(`/escrows/${options.escrowId}/fund`)) {
    return {
      status: 200,
      body: { ...escrowsFixture.fundEscrow, escrowId: options.escrowId },
    };
  }

  // Ship Escrow — must satisfy the client's isTracking guard, so the fixture
  // is shaped as a Tracking response rather than a partial escrow merge.
  if (options?.escrowId && pathname.includes(`/escrows/${options.escrowId}/ship`)) {
    return {
      status: 200,
      body: {
        escrowId: options.escrowId,
        status: "SHIPPED",
        carrier: escrowsFixture.shipEscrow.carrier,
        trackingNumber: escrowsFixture.shipEscrow.trackingId,
        events: [],
      },
    };
  }

  // Dispute Escrow (Create or Fetch)
  if (options?.escrowId && options.disputePostError && pathname.includes(`/escrows/${options.escrowId}/dispute`) && method === "POST") {
    return { status: 500, body: { message: "Internal server error" } };
  }

  // Dispute Escrow (Create or Fetch)
  if (options?.escrowId && pathname.includes(`/escrows/${options.escrowId}/dispute`)) {
    return { status: 200, body: options.mockDispute };
  }

  // Vendor Dashboard Escrows
  if (pathname.includes("/vendor/escrows") && options?.mockEscrowsList) {
    return { status: 200, body: options.mockEscrowsList };
  }

  // Admin disputes list — empties once the dispute has been resolved.
  if (
    method === "GET" &&
    pathname.endsWith("/disputes") &&
    options?.adminResolveDispute
  ) {
    if (isAdminDisputeResolved(options)) {
      return { status: 200, body: [] };
    }
    return options.mockDispute
      ? { status: 200, body: [options.mockDispute] }
      : null;
  }

  // Disputes List
  if (pathname.includes("/disputes") && method === "GET") {
    // If asking for a specific dispute by ID
    if (options?.mockDispute && pathname.match(/\/disputes\/[^?]+$/)) {
      return { status: 200, body: options.mockDispute };
    }
    // If asking for a list
    if (options?.mockDisputesList) {
      return { status: 200, body: options.mockDisputesList };
    }
  }

  // Resolve Dispute
  if (pathname.includes("/resolve") && method === "POST") {
    return {
      status: 200,
      body: { ...(options?.mockDispute || {}), ...disputesFixture.resolveDispute },
    };
  }

  return null;
}
