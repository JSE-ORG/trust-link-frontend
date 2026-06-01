import { afterEach, describe, expect, it, vi, beforeEach } from "vitest";
import * as freighter from "./freighter";
import { TxExpiredError, TxFailedError, confirmDelivery, fundEscrow, raiseDispute } from "./contracts";

vi.mock("./freighter", () => ({
  signTransaction: vi.fn(),
}));

vi.mock("@stellar/stellar-sdk", () => {
  class Account {
    constructor(public publicKey: string, public sequence: string) {}
  }

  class TransactionBuilder {
    private readonly _tx: any;
    constructor(source: any, opts: any) {
      this._tx = { source, opts, ops: [] };
    }
    addOperation(op: any) {
      this._tx.ops.push(op);
      return this;
    }
    setTimeout(timeout: number) {
      this._tx.timeout = timeout;
      return this;
    }
    build() {
      return {
        toXDR: () => "signed-transaction-xdr",
      };
    }
  }

  class SorobanServer {
    constructor(public url: string) {}
    async getAccount(publicKey: string) {
      return { sequence: "1234567890" };
    }
  }

  return {
    Networks: {
      TESTNET: "Test SDF Network ; September 2021",
      PUBLIC: "Public Global Stellar Network ; September 2015",
    },
    SorobanServer,
    TransactionBuilder,
    Account,
    Operation: {
      invokeHostFunction: vi.fn((opts: any) => ({ type: "invokeHostFunction", opts })),
    },
    xdr: {
      Uint64: {
        fromString: vi.fn((value: string) => value),
      },
      ScVal: {
        scvU64: vi.fn((value: any) => ({ type: "u64", value })),
        scvBool: vi.fn((value: boolean) => ({ type: "bool", value })),
        scvBytes: vi.fn((value: Buffer) => ({ type: "bytes", value })),
      },
      ScAddress: {
        scAddressTypeContract: vi.fn((contract: any) => ({ type: "contractAddress", contract })),
      },
      ScAddressContract: {
        contractId: vi.fn((hash: Buffer) => ({ type: "contractId", hash })),
      },
      HostFunction: {
        hostFunctionTypeInvokeContract: vi.fn((args: any) => ({ type: "invokeContract", args })),
      },
      InvokeContractArgs: class {
        constructor(public readonly attrs: any) {}
      },
      ScSymbol: {
        fromString: vi.fn((value: string) => value),
      },
      Vec: class {
        constructor(public items: any[] = []) {}
      },
    },
    StrKey: {
      decodeContract: vi.fn((value: string) => Buffer.from(value, "utf8")),
    },
  };
});

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.mocked(freighter.signTransaction).mockResolvedValue("signed-xdr");
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("contracts library", () => {
  it("fundEscrow signs and submits a Soroban transaction", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: { hash: "hash-123", xdr: "result-xdr" } }),
    });

    const result = await fundEscrow({
      contractId: "CABC123",
      publicKey: "GABC123",
      escrowId: "escrow-1",
      amount: 1000n,
    });

    expect(result).toEqual({ hash: "hash-123", resultXdr: "result-xdr" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({
      method: "POST",
      headers: { "Content-Type": "application/json" },
    }));
  });

  it("confirmDelivery returns RPC result", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: { hash: "delivery-hash", xdr: "delivery-xdr" } }),
    });

    const result = await confirmDelivery({
      contractId: "CABC123",
      publicKey: "GABC123",
      escrowId: "escrow-1",
    });

    expect(result.hash).toBe("delivery-hash");
    expect(result.resultXdr).toBe("delivery-xdr");
  });

  it("raiseDispute returns RPC result", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ result: { hash: "dispute-hash", xdr: "dispute-xdr" } }),
    });

    const result = await raiseDispute({
      contractId: "CABC123",
      publicKey: "GABC123",
      escrowId: "escrow-2",
      reason: "Item arrived damaged",
    });

    expect(result.hash).toBe("dispute-hash");
    expect(result.resultXdr).toBe("dispute-xdr");
  });

  it("throws TxFailedError when RPC returns tx_failed", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: { message: "tx_failed: contract invocation failed" } }),
    });

    await expect(
      fundEscrow({
        contractId: "CABC123",
        publicKey: "GABC123",
        escrowId: "escrow-1",
        amount: 1,
      })
    ).rejects.toBeInstanceOf(TxFailedError);
  });

  it("throws TxExpiredError when RPC returns tx_expired", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: { message: "tx_expired: transaction expired" } }),
    });

    await expect(
      confirmDelivery({
        contractId: "CABC123",
        publicKey: "GABC123",
        escrowId: "escrow-1",
      })
    ).rejects.toBeInstanceOf(TxExpiredError);
  });
});
