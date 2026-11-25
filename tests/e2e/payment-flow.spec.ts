import type { Page } from "@playwright/test";
import { Account, Asset, Keypair, Networks, Operation, StrKey, TransactionBuilder } from "@stellar/stellar-sdk";
import { expect,test } from "next/experimental/testmode/playwright";

import { type MockEscrow,setupNetworkMocks, setupNextOnFetch } from "./helpers/mock-api";
import { mockFreighter } from "./helpers/mock-freighter";

const TEST_ESCROW_ID = "test_escrow_e2e_001";
// Paying runs the whole pipeline (wallet, build, sign, submit, confirm), so the fixtures
// have to be real: a valid account for the wallet, a valid contract id for the escrow, and
// a signed transaction the SDK can parse when the app submits it.
const MOCK_PUBLIC_KEY = Keypair.fromRawEd25519Seed(Buffer.alloc(32, 7)).publicKey();
const MOCK_CONTRACT_ID = StrKey.encodeContract(Buffer.alloc(32, 3));
const MOCK_SIGNED_XDR = new TransactionBuilder(new Account(MOCK_PUBLIC_KEY, "0"), {
  fee: "100",
  networkPassphrase: Networks.TESTNET,
})
  .addOperation(Operation.payment({ destination: MOCK_PUBLIC_KEY, asset: Asset.native(), amount: "1" }))
  .setTimeout(30)
  .build()
  .toXDR();
const MOCK_TX_HASH = "ab".repeat(32);

/**
 * Answers the app's Soroban JSON-RPC calls: `sendTransaction` accepts the signed
 * transaction and `getTransaction` reports it as included. Registered after
 * `setupNetworkMocks`, so it takes precedence over that helper's catch-all RPC stub.
 */
async function mockSorobanRpc(page: Page) {
  const ledger = { latestLedger: 100, latestLedgerCloseTime: "1700000000" };
  await page.route(/soroban.*stellar\.org/, async (route) => {
    const { id, method } = route.request().postDataJSON() as { id: number | string; method: string };
    const result =
      method === "sendTransaction"
        ? { status: "PENDING", hash: MOCK_TX_HASH, ...ledger }
        : {
            status: "SUCCESS",
            ...ledger,
            oldestLedger: 1,
            oldestLedgerCloseTime: "1700000000",
            ledger: 100,
            createdAt: "1700000000",
            applicationOrder: 1,
            feeBump: false,
            envelopeXdr: MOCK_SIGNED_XDR,
            // A TransactionResult with txSUCCESS and no operation results, and a v0 meta with no operations.
            resultXdr: Buffer.alloc(20).toString("base64"),
            resultMetaXdr: Buffer.alloc(8).toString("base64"),
          };
    await route.fulfill({ contentType: "application/json", body: JSON.stringify({ jsonrpc: "2.0", id, result }) });
  });
}

const mockEscrow: MockEscrow = {
  id: TEST_ESCROW_ID,
  vendorId: "vendor_test_1",
  contractAddress: MOCK_CONTRACT_ID,
  // No buyer yet — the escrow is claimed when the buyer funds it.
  buyerId: undefined,
  amount: 150.0,
  item: "Test Product",
  status: "PENDING",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  history: [],
};

test.describe("Buyer payment flow", () => {
  test.beforeEach(async ({ page, next }) => {
    await setupNetworkMocks(page, next, { escrowId: TEST_ESCROW_ID, mockEscrow });
    await mockSorobanRpc(page);

    // Inject mock Freighter wallet into window before page load
    await mockFreighter(page, MOCK_PUBLIC_KEY, MOCK_SIGNED_XDR);
  });

  test("navigates to /pay/:escrowId with a test escrow", async ({ page }) => {
    await page.goto(`/pay/${TEST_ESCROW_ID}`);

    await expect(page).toHaveURL(`/pay/${TEST_ESCROW_ID}`);
    // Escrow item name appears on page in a definition element
    await expect(page.locator("dd").filter({ hasText: "Test Product" }).first()).toBeVisible();
  });

  test("submits payment and shows success message", async ({ page }) => {
    await page.goto(`/pay/${TEST_ESCROW_ID}`);

    const payBtn = page.getByRole("button", { name: /Pay Now/i });
    await expect(payBtn).toBeVisible();
    
    // Fill contact info and submit. The button exists in SSR HTML before React
    // hydrates, so retry the whole interaction until the click lands and the
    // success indicator appears (same pattern as the wallet-rejection test).
    const emailInput = page.getByLabel(/Email address/i);
    await expect(async () => {
      await emailInput.fill("buyer@example.com");
      await expect(emailInput).toHaveValue("buyer@example.com");
      await payBtn.click();
      // After connecting, signing, submitting and confirming, the success message and the
      // transaction hash appear.
      await expect(page.getByText(/Payment Confirmed!/i).first()).toBeVisible({ timeout: 5_000 });
      await expect(page.getByText(MOCK_TX_HASH).first()).toBeVisible();
    }).toPass({ timeout: 20_000 });
  });

  test("displays tracking timeline when escrow is funded", async ({ page, next }) => {
    setupNextOnFetch(next, { escrowId: TEST_ESCROW_ID, mockEscrow: { ...mockEscrow, status: "FUNDED" } });

    await page.goto(`/pay/${TEST_ESCROW_ID}`);

    await expect(page.getByText(/This escrow is already funded/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/Shipment Tracking/i)).toBeVisible();
  });
});

test.describe("Buyer payment flow — wallet rejection", () => {
  test.beforeEach(async ({ page, next }) => {
    await setupNetworkMocks(page, next, { escrowId: TEST_ESCROW_ID, mockEscrow });

    // Freighter connects fine, but the user presses "Reject" on the signing
    // dialog, so `signTransaction` comes back with an error instead of an XDR.
    await mockFreighter(page, MOCK_PUBLIC_KEY, MOCK_SIGNED_XDR, { rejectSignature: true });
  });

  test("shows an error toast and no success state when the user rejects the signature", async ({ page }) => {
    await page.goto(`/pay/${TEST_ESCROW_ID}`);

    const payBtn = page.getByRole("button", { name: /Pay Now/i });
    // The button stays disabled until the wallet provider finishes initialising,
    // which also means the payment form has hydrated and won't reset our input.
    await expect(payBtn).toBeEnabled({ timeout: 15_000 });

    const emailInput = page.getByLabel(/Email address/i);
    const errorToast = page
      .locator('[data-sonner-toast][data-type="error"]')
      .filter({ hasText: /sign|authentication/i });

    // Enter contact details and submit. Retry the whole interaction: a stray
    // keystroke landing before React finished hydrating the controlled input
    // would otherwise trip the "provide a contact method" guard instead of
    // reaching the wallet.
    await expect(async () => {
      await emailInput.fill("");
      await emailInput.pressSequentially("buyer@example.com", { delay: 15 });
      await expect(emailInput).toHaveValue("buyer@example.com");
      await payBtn.click();
      await expect(errorToast.first()).toBeVisible({ timeout: 5_000 });
    }).toPass({ timeout: 20_000 });

    // The success confirmation must never appear on a rejected signature.
    await expect(page.getByText(/Freighter signature completed/i)).toHaveCount(0);

    // The button recovers so the buyer can retry.
    await expect(payBtn).toBeEnabled();
    await expect(payBtn).toHaveText(/Pay Now/i);
  });
});
