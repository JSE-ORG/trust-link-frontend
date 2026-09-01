import { Page } from "@playwright/test";
import { NextFixture } from "next/experimental/testmode/playwright";

import type { EscrowInput } from "@/lib/api";
import type { Dispute, Escrow } from "@/types";

import disputesFixture from "../fixtures/disputes.json";
import escrowsFixture from "../fixtures/escrows.json";

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
}

export function setupNextOnFetch(next: NextFixture, options?: MockApiOptions) {
  next.onFetch(async (request) => {
    const url = new URL(request.url);
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

  // Ship Escrow
  if (options?.escrowId && pathname.includes(`/escrows/${options.escrowId}/ship`)) {
    return {
      status: 200,
      body: {
        ...(options.mockEscrow || {}),
        ...escrowsFixture.shipEscrow,
      },
    };
  }

  // Dispute Escrow (Create or Fetch)
  if (options?.escrowId && pathname.includes(`/escrows/${options.escrowId}/dispute`)) {
    return { status: 200, body: options.mockDispute };
  }

  // Vendor Dashboard Escrows
  if (pathname.includes("/vendor/escrows") && options?.mockEscrowsList) {
    return { status: 200, body: options.mockEscrowsList };
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
