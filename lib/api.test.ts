import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  getEscrow,
  getVendorEscrows,
  createEscrow,
  getDispute,
  getAdminDisputes,
  resolveDispute,
  createDispute,
  getTracking,
  getSubscription,
  upgradeSubscription,
  patchVendorNotifications,
  patchBuyerContact,
  type VendorNotificationPreferences,
} from "@/lib/api";

/** Build a minimal fetch Response stand-in. */
function mockResponse(
  body: unknown,
  { ok = true, text = "" }: { ok?: boolean; text?: string } = {}
) {
  return {
    ok,
    json: async () => body,
    text: async () => text,
  } as unknown as Response;
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

/** Convenience accessors for the most recent fetch(url, init) call. */
function lastCall() {
  const [url, init] = fetchMock.mock.calls[fetchMock.mock.calls.length - 1];
  return { url: String(url), init: (init ?? {}) as RequestInit };
}

describe("getEscrow", () => {
  it("returns the escrow from the primary endpoint", async () => {
    const escrow = { id: "e1" };
    fetchMock.mockResolvedValueOnce(mockResponse(escrow));

    await expect(getEscrow("e1")).resolves.toEqual(escrow);
    expect(lastCall().url).toContain("/escrow/e1");
  });

  it("falls back to the plural endpoint when the primary 404s", async () => {
    const escrow = { id: "e2" };
    fetchMock
      .mockResolvedValueOnce(mockResponse(null, { ok: false }))
      .mockResolvedValueOnce(mockResponse(escrow));

    await expect(getEscrow("e2")).resolves.toEqual(escrow);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(lastCall().url).toContain("/escrows/e2");
  });

  it("throws when both endpoints fail", async () => {
    fetchMock
      .mockResolvedValueOnce(mockResponse(null, { ok: false }))
      .mockResolvedValueOnce(mockResponse(null, { ok: false }));

    await expect(getEscrow("e3")).rejects.toThrow("Failed to fetch escrow");
  });
});

describe("getVendorEscrows", () => {
  it("requests vendor escrows without an auth header when no token is given", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse([{ id: "e1" }]));

    await getVendorEscrows();
    const { url, init } = lastCall();
    expect(url).toContain("/vendor/escrows");
    expect((init.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it("attaches a Bearer token when provided", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse([]));

    await getVendorEscrows("tok123");
    const headers = lastCall().init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer tok123");
  });

  it("throws on a non-ok response", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, { ok: false }));
    await expect(getVendorEscrows()).rejects.toThrow("Failed to fetch vendor escrows");
  });
});

describe("createEscrow", () => {
  const input = {
    itemName: "Laptop",
    priceUSDC: "100",
    description: "A laptop",
    shippingWindow: "3 days",
  };

  it("POSTs the payload as JSON and returns the response", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ url: "/pay/abc" }));

    await expect(createEscrow(input)).resolves.toEqual({ url: "/pay/abc" });
    const { url, init } = lastCall();
    expect(url).toContain("/escrow");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toEqual(input);
  });

  it("includes the server error text in the thrown message", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, { ok: false, text: "bad request" }));
    await expect(createEscrow(input)).rejects.toThrow("Failed to create escrow: bad request");
  });
});

describe("getDispute", () => {
  it("fetches a dispute and forwards the token", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ id: "d1" }));
    await getDispute("d1", "tok");
    const headers = lastCall().init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer tok");
  });

  it("throws on failure", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, { ok: false }));
    await expect(getDispute("d1")).rejects.toThrow("Failed to fetch dispute");
  });
});

describe("getAdminDisputes", () => {
  it("filters out resolved disputes client-side", async () => {
    fetchMock.mockResolvedValueOnce(
      mockResponse([
        { id: "1", status: "OPEN" },
        { id: "2", status: "RESOLVED" },
        { id: "3", status: "UNDER_REVIEW" },
      ])
    );

    const result = await getAdminDisputes();
    expect(result.map((d) => d.id)).toEqual(["1", "3"]);
  });
});

describe("resolveDispute", () => {
  it("PATCHes the resolution with a JSON body", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ id: "d1", status: "RESOLVED" }));

    await resolveDispute("d1", "REFUND_BUYER", "tok");
    const { url, init } = lastCall();
    expect(url).toContain("/disputes/d1/resolve");
    expect(init.method).toBe("PATCH");
    expect(JSON.parse(init.body as string)).toEqual({ resolution: "REFUND_BUYER" });
  });

  it("throws on a non-ok response", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, { ok: false }));
    await expect(resolveDispute("d1", "RELEASE_TO_VENDOR")).rejects.toThrow("Failed to resolve dispute");
  });
});

describe("createDispute", () => {
  it("POSTs reason/description/evidence to the escrow dispute endpoint", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ id: "d9" }));
    const payload = { reason: "not delivered", description: "never arrived", evidence: ["url"] };

    await createDispute("e1", payload);
    const { url, init } = lastCall();
    expect(url).toContain("/escrows/e1/dispute");
    expect(JSON.parse(init.body as string)).toEqual(payload);
  });

  it("surfaces the server error text", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, { ok: false, text: "nope" }));
    await expect(
      createDispute("e1", { reason: "r", description: "d", evidence: [] })
    ).rejects.toThrow("Failed to raise dispute: nope");
  });
});

describe("getTracking", () => {
  it("returns tracking details", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ escrowId: "e1", status: "IN_TRANSIT" }));
    await expect(getTracking("e1")).resolves.toMatchObject({ status: "IN_TRANSIT" });
    expect(lastCall().url).toContain("/escrows/e1/tracking");
  });

  it("throws on failure", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, { ok: false }));
    await expect(getTracking("e1")).rejects.toThrow("Failed to fetch tracking details");
  });
});

describe("subscription endpoints", () => {
  it("getSubscription returns the plan", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ plan: "PRO", vendorId: "v1" }));
    await expect(getSubscription("tok")).resolves.toMatchObject({ plan: "PRO" });
  });

  it("upgradeSubscription POSTs and returns the upgraded plan", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse({ plan: "PRO", vendorId: "v1" }));
    await expect(upgradeSubscription("tok")).resolves.toMatchObject({ plan: "PRO" });
    expect(lastCall().init.method).toBe("POST");
  });

  it("upgradeSubscription throws with the server error text", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, { ok: false, text: "limit" }));
    await expect(upgradeSubscription()).rejects.toThrow("Upgrade failed: limit");
  });
});

describe("notification + contact mutations", () => {
  const prefs: VendorNotificationPreferences = {
    funded: { email: true, sms: false },
    shipped: { email: true, sms: false },
    delivered: { email: false, sms: false },
    disputed: { email: true, sms: true },
    completed: { email: true, sms: false },
  };

  it("patchVendorNotifications sends prefs with auth and resolves void", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null));
    await expect(patchVendorNotifications(prefs, "tok")).resolves.toBeUndefined();
    const { init } = lastCall();
    expect(init.method).toBe("PATCH");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer tok");
    expect(JSON.parse(init.body as string)).toEqual(prefs);
  });

  it("patchVendorNotifications throws on failure", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, { ok: false }));
    await expect(patchVendorNotifications(prefs, "tok")).rejects.toThrow(
      "Failed to save notification preferences"
    );
  });

  it("patchBuyerContact PATCHes contact info", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null));
    await patchBuyerContact("e1", { email: "a@b.com" });
    const { url, init } = lastCall();
    expect(url).toContain("/escrow/e1/buyer-contact");
    expect(init.method).toBe("PATCH");
  });

  it("patchBuyerContact surfaces the server error text", async () => {
    fetchMock.mockResolvedValueOnce(mockResponse(null, { ok: false, text: "invalid" }));
    await expect(patchBuyerContact("e1", {})).rejects.toThrow(
      "Failed to save contact info: invalid"
    );
  });
});
