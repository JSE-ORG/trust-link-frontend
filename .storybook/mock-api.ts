import type { Escrow } from "@/types";

export const mockVendorEscrows: Escrow[] = [
  {
    id: "escrow_mock_001",
    vendorId: "vendor_storybook",
    buyerId: "buyer_001",
    amount: 150.0,
    item: "Mechanical Keyboard",
    description: "Custom mechanical keyboard with lubricated switches",
    status: "FUNDED",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    history: [
      {
        id: "hist_001",
        escrowId: "escrow_mock_001",
        status: "PENDING",
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        description: "Escrow created",
      },
      {
        id: "hist_002",
        escrowId: "escrow_mock_001",
        status: "FUNDED",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        description: "Payment confirmed by buyer",
      },
    ],
  },
  {
    id: "escrow_mock_002",
    vendorId: "vendor_storybook",
    buyerId: undefined,
    amount: 85.5,
    item: "Studio Headphones",
    description: "Over-ear monitoring headphones",
    status: "PENDING",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    history: [
      {
        id: "hist_003",
        escrowId: "escrow_mock_002",
        status: "PENDING",
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        description: "Escrow created",
      },
    ],
  },
  {
    id: "escrow_mock_003",
    vendorId: "vendor_storybook",
    buyerId: "buyer_003",
    amount: 320.0,
    item: "4K Monitor",
    description: "Ultra HD IPS display",
    status: "SHIPPED",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    history: [
      {
        id: "hist_004",
        escrowId: "escrow_mock_003",
        status: "PENDING",
        timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
        description: "Escrow created",
      },
      {
        id: "hist_005",
        escrowId: "escrow_mock_003",
        status: "FUNDED",
        timestamp: new Date(Date.now() - 86400000 * 4).toISOString(),
        description: "Payment funded",
      },
      {
        id: "hist_006",
        escrowId: "escrow_mock_003",
        status: "SHIPPED",
        timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
        description: "Shipped via DHL (Tracking #DHL-99210)",
      },
    ],
  },
  {
    id: "escrow_mock_004",
    vendorId: "vendor_storybook",
    buyerId: "buyer_004",
    amount: 50.0,
    item: "USB-C Hub",
    description: "7-in-1 USB-C multiport adapter",
    status: "COMPLETED",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    history: [
      {
        id: "hist_007",
        escrowId: "escrow_mock_004",
        status: "COMPLETED",
        timestamp: new Date(Date.now() - 86400000 * 3).toISOString(),
        description: "Funds released to vendor",
      },
    ],
  },
];

/**
 * Installs a safe fetch mock for Storybook previews so components never hit
 * real backend APIs or payment endpoints during story rendering and interactions.
 */
export function setupStorybookFetchMock(options?: {
  escrows?: Escrow[];
  simulateError?: boolean;
}) {
  if (typeof window === "undefined") return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlString = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

    if (options?.simulateError && urlString.includes("/vendor/escrows")) {
      return new Response(JSON.stringify({ message: "Failed to load escrows" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (urlString.includes("/vendor/escrows")) {
      const escrowsData = options?.escrows ?? mockVendorEscrows;
      return new Response(JSON.stringify(escrowsData), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (urlString.includes("/auth/challenge")) {
      return new Response(
        JSON.stringify({
          transaction: "mock_challenge_xdr",
          network_passphrase: "Test SDF Network ; September 2015",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (urlString.includes("/auth/verify")) {
      return new Response(
        JSON.stringify({ token: "mock_storybook_jwt_token" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (urlString.includes("/buyer-contact")) {
      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (urlString.includes("/escrow")) {
      return new Response(
        JSON.stringify(mockVendorEscrows[0]),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Default to empty JSON response for any other unmocked API call
    if (urlString.includes("/api/")) {
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    return originalFetch(input, init);
  };
}
