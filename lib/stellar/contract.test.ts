import { rpc } from "@stellar/stellar-sdk";
import { afterEach,beforeEach,describe, expect, it, vi } from "vitest";

import {
  buildContractDeployment,
  buildContractInvocation,
  confirmDelivery,
  ContractArg,
  ContractCallOptions,
  fundEscrow,
  isContractSuccess,
  isMockPaymentsEnabled,
  isValidContractId,
  parseContractError,
  parseContractResult,
  raiseDispute,
  submitPayment,
  TransactionConfirmationTimeoutError,
  validateContractMethodCall,
} from "./contract";
import * as freighter from "./freighter";

vi.mock("./freighter", () => ({
  signTransaction: vi.fn(),
}));

// Mock Stellar SDK
vi.mock("@stellar/stellar-sdk", async () => {
  const actual = await vi.importActual<typeof import("@stellar/stellar-sdk")>(
    "@stellar/stellar-sdk"
  );
  function buildTx() {
    return {
      addOperation: vi.fn().mockReturnThis(),
      setTimeout: vi.fn().mockReturnThis(),
      build: vi.fn().mockReturnValue({
        toXDR: vi.fn().mockReturnValue("mock-xdr-string"),
      }),
    };
  }
  function MockTxBuilderFn() {
    return buildTx();
  }
  const MockTxBuilder = vi.fn().mockImplementation(MockTxBuilderFn);
  (MockTxBuilder as unknown as { fromXDR: () => unknown }).fromXDR = function () {
    return buildTx();
  };

  function MockServer() {
    return {
      getAccount: vi.fn().mockResolvedValue({ accountId: "GTEST", sequenceNumber: "0" }),
      sendTransaction: vi.fn(),
      getTransaction: vi.fn(),
    };
  }

  class MockScVal {}

  return {
    // StrKey is used for real address/contract-id validation, so the checks
    // exercised here are the SDK's own, not a hand-rolled stand-in.
    StrKey: actual.StrKey,
    Asset: { native: vi.fn(() => ({ code: "XLM" })) },
    Account: vi.fn().mockImplementation(function (accountId: string, sequence: string) {
      return {
        accountId: () => accountId,
        sequenceNumber: () => sequence,
        incrementSequenceNumber: () => {},
      };
    }),
    Contract: vi.fn().mockImplementation(function(id) {
      return {
        id,
        call: vi.fn().mockReturnValue({ type: "invocation" }),
      };
    }),
    Keypair: { random: vi.fn() },
    TransactionBuilder: MockTxBuilder,
    Networks: actual.Networks,
    Operation: {
      invokeHostFunction: vi.fn().mockReturnValue({}),
      extendFootprintTtl: vi.fn().mockReturnValue({}),
      invokeContractFunction: vi.fn().mockReturnValue({}),
      uploadContractWasm: vi.fn().mockReturnValue({}),
      payment: vi.fn().mockReturnValue({}),
    },
    nativeToScVal: vi.fn().mockImplementation((val: unknown) => ({ type: "mock-scval", value: val })),
    xdr: {
      TransactionEnvelope: {
        fromXDR: vi.fn().mockReturnValue("tx-envelope"),
      },
      ScVal: MockScVal,
    },
    rpc: {
      Server: vi.fn().mockImplementation(MockServer),
      Api: {
        GetTransactionStatus: {
          SUCCESS: "SUCCESS",
          NOT_FOUND: "NOT_FOUND",
          FAILED: "FAILED",
        },
      },
    },
    SorobanRpc: {
      Server: vi.fn().mockImplementation(MockServer),
    },
    BASE_FEE: "100",
  };
});

/** Real Ed25519 account key (StrKey-valid). */
const VALID_SOURCE_ACCOUNT = "GAEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEEQSCIJBEEQSH7S";

/** Real contract StrKey (C…, 56 chars, valid CRC-16 checksum). */
const VALID_CONTRACT_ID = "CAAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQC526";

describe("lib/stellar/contract.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(freighter.signTransaction).mockResolvedValue("signed-xdr");
  });

  describe("buildContractInvocation", () => {
    const validSourceAccount = VALID_SOURCE_ACCOUNT;
    const validContractId = VALID_CONTRACT_ID;

    it("builds contract invocation XDR for testnet", () => {
      const options: ContractCallOptions = {
        contractId: validContractId,
        method: "transfer",
        args: ["arg1", "arg2"],
        sourceAccount: validSourceAccount,
        network: "TESTNET",
      };

      const result = buildContractInvocation(options);
      expect(result).toBe("mock-xdr-string");
    });

    it("builds contract invocation XDR for mainnet", () => {
      const options: ContractCallOptions = {
        contractId: validContractId,
        method: "approve",
        args: [],
        sourceAccount: validSourceAccount,
        network: "PUBLIC",
      };

      const result = buildContractInvocation(options);
      expect(result).toBe("mock-xdr-string");
    });

    it("throws error for invalid contract ID format", () => {
      const options: ContractCallOptions = {
        contractId: "INVALID_ID",
        method: "transfer",
        args: [],
        sourceAccount: validSourceAccount,
        network: "TESTNET",
      };

      expect(() => buildContractInvocation(options)).toThrow("Invalid contract ID");
    });

    it("throws error when contract ID is missing", () => {
      const options: ContractCallOptions = {
        contractId: "",
        method: "transfer",
        args: [],
        sourceAccount: validSourceAccount,
        network: "TESTNET",
      };

      expect(() => buildContractInvocation(options)).toThrow("Invalid contract ID");
    });

    it("throws error for missing method name", () => {
      const options: ContractCallOptions = {
        contractId: validContractId,
        method: "",
        args: [],
        sourceAccount: validSourceAccount,
        network: "TESTNET",
      };

      expect(() => buildContractInvocation(options)).toThrow("Method name is required");
    });

    it("throws error for invalid source account", () => {
      const options: ContractCallOptions = {
        contractId: validContractId,
        method: "transfer",
        args: [],
        sourceAccount: "invalid-key",
        network: "TESTNET",
      };

      expect(() => buildContractInvocation(options)).toThrow("Invalid source account public key");
    });

    it("accepts custom fee", () => {
      const options: ContractCallOptions = {
        contractId: validContractId,
        method: "transfer",
        args: [],
        sourceAccount: validSourceAccount,
        network: "TESTNET",
        fee: "500",
      };

      const result = buildContractInvocation(options);
      expect(result).toBe("mock-xdr-string");
    });
  });

  describe("isValidContractId", () => {
    it("returns true for valid contract ID", () => {
      expect(isValidContractId(VALID_CONTRACT_ID)).toBe(true);
    });

    it("returns false for non-string input", () => {
      expect(isValidContractId(null as unknown as string)).toBe(false);
      expect(isValidContractId(undefined as unknown as string)).toBe(false);
      expect(isValidContractId(123 as unknown as string)).toBe(false);
    });

    it("returns false when not starting with C", () => {
      expect(isValidContractId(VALID_SOURCE_ACCOUNT)).toBe(false);
      expect(isValidContractId("INVALID")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isValidContractId("")).toBe(false);
    });

    it("rejects a bare C prefix", () => {
      expect(isValidContractId("C")).toBe(false);
    });

    it("rejects a C-prefixed placeholder with no valid checksum", () => {
      expect(isValidContractId("Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")).toBe(false);
      expect(isValidContractId("CCCZQVD4JFF2Z56XDQY2XHXGTWHBZWBRWQJL4QBFQZR77EAPBFQWKQ6S")).toBe(false);
    });

    it("rejects a truncated contract ID", () => {
      expect(isValidContractId(VALID_CONTRACT_ID.slice(0, 40))).toBe(false);
      expect(isValidContractId(`${VALID_CONTRACT_ID}A`)).toBe(false);
    });

    it("rejects a contract ID with a corrupted checksum", () => {
      const tampered = `${VALID_CONTRACT_ID.slice(0, -1)}${
        VALID_CONTRACT_ID.endsWith("6") ? "7" : "6"
      }`;

      expect(isValidContractId(tampered)).toBe(false);
    });

    it("rejects an Ed25519 account key", () => {
      expect(isValidContractId(VALID_SOURCE_ACCOUNT)).toBe(false);
    });
  });

  describe("parseContractError", () => {
    it("returns string error as-is", () => {
      const error = "Simple error message";
      expect(parseContractError(error)).toBe("Simple error message");
    });

    it("extracts message from error object", () => {
      const error = { message: "Error from object" };
      expect(parseContractError(error)).toBe("Error from object");
    });

    it("formats contract error type", () => {
      const error = {
        type: "ContractError",
        details: "Insufficient balance",
      };
      expect(parseContractError(error)).toBe("Contract Error: Insufficient balance");
    });

    it("returns default message for unknown error format", () => {
      expect(parseContractError(null)).toBe("An unknown error occurred");
      expect(parseContractError(undefined)).toBe("An unknown error occurred");
      expect(parseContractError({})).toBe("An unknown error occurred");
    });

    it("handles error without details", () => {
      const error = { type: "ContractError" };
      expect(parseContractError(error)).toBe("Contract Error: Unknown error");
    });
  });

  describe("parseContractResult", () => {
    it("returns null for null/undefined input", () => {
      expect(parseContractResult(null)).toBe(null);
      expect(parseContractResult(undefined)).toBe(null);
    });

    it("extracts result property if present", () => {
      const response = { result: { value: "test" } };
      expect(parseContractResult(response)).toEqual({ value: "test" });
    });

    it("extracts value property if result not present", () => {
      const response = { value: "direct-value" };
      expect(parseContractResult(response)).toBe("direct-value");
    });

    it("returns entire response if no extractable property", () => {
      const response = { data: "raw-data" };
      expect(parseContractResult(response)).toEqual({ data: "raw-data" });
    });

    it("handles numeric values", () => {
      const response = { value: 12345 };
      expect(parseContractResult(response)).toBe(12345);
    });

    it("handles boolean values", () => {
      const response = { value: false };
      expect(parseContractResult(response)).toBe(false);
    });
  });

  describe("validateContractMethodCall", () => {
    it("validates correct method and args", () => {
      const result = validateContractMethodCall("transfer", ["to", "amount"]);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it("rejects non-string method", () => {
      const result = validateContractMethodCall(null as unknown as string, []);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("non-empty string");
    });

    it("rejects empty method name", () => {
      const result = validateContractMethodCall("", []);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("non-empty string");
    });

    it("rejects non-array arguments", () => {
      const result = validateContractMethodCall("transfer", "not-an-array" as unknown as ContractArg[]);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Arguments must be an array");
    });

    it("rejects method name exceeding max length", () => {
      const longMethod = "a".repeat(257);
      const result = validateContractMethodCall(longMethod, []);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("Method name too long");
    });

    it("accepts method name at max length", () => {
      const maxMethod = "a".repeat(256);
      const result = validateContractMethodCall(maxMethod, []);
      expect(result.valid).toBe(true);
    });

    it("validates with multiple arguments", () => {
      const result = validateContractMethodCall("complexCall", [
        "arg1",
        "arg2",
        "arg3",
        { nested: "object" },
      ]);
      expect(result.valid).toBe(true);
    });
  });

  describe("buildContractDeployment", () => {
    const validSourceAccount = VALID_SOURCE_ACCOUNT;
    const mockWasm = Buffer.from("mock wasm content");

    it("builds deployment transaction for testnet", () => {
      const result = buildContractDeployment(mockWasm, validSourceAccount, "TESTNET");
      expect(result).toBe("mock-xdr-string");
    });

    it("builds deployment transaction for mainnet", () => {
      const result = buildContractDeployment(mockWasm, validSourceAccount, "PUBLIC");
      expect(result).toBe("mock-xdr-string");
    });

    it("throws error for empty WASM buffer", () => {
      const emptyBuffer = Buffer.from("");
      expect(() => buildContractDeployment(emptyBuffer, validSourceAccount, "TESTNET")).toThrow(
        "WASM buffer cannot be empty"
      );
    });

    it("throws error for null WASM buffer", () => {
      expect(() => buildContractDeployment(null as unknown as Buffer, validSourceAccount, "TESTNET")).toThrow(
        "WASM buffer cannot be empty"
      );
    });

    it("throws error for invalid source account", () => {
      expect(() => buildContractDeployment(mockWasm, "invalid-key", "TESTNET")).toThrow(
        "Invalid source account public key"
      );
    });
  });

  describe("isContractSuccess", () => {
    it("returns true when success is explicitly true", () => {
      expect(isContractSuccess({ success: true })).toBe(true);
    });

    it("returns true when error is null", () => {
      expect(isContractSuccess({ error: null })).toBe(true);
    });

    it("returns true when error is undefined", () => {
      expect(isContractSuccess({ error: undefined })).toBe(true);
    });

    it("returns false when success is false", () => {
      expect(isContractSuccess({ success: false })).toBe(false);
    });

    it("returns false when error is set", () => {
      expect(isContractSuccess({ error: "Some error occurred" })).toBe(false);
    });

    it("returns false for null response", () => {
      expect(isContractSuccess(null)).toBe(false);
    });

    it("returns false for undefined response", () => {
      expect(isContractSuccess(undefined)).toBe(false);
    });

    it("treats empty object as success", () => {
      expect(isContractSuccess({})).toBe(true);
    });

    it("prioritizes explicit success flag", () => {
      expect(isContractSuccess({ success: true, error: "ignored" })).toBe(true);
      expect(isContractSuccess({ success: false, error: null })).toBe(false);
    });
  });

  describe("Soroban contract call helpers", () => {
    const validSourceAccount = VALID_SOURCE_ACCOUNT;
    const validContractId = VALID_CONTRACT_ID;

    it("fundEscrow returns hash and result XDR on success", async () => {
      const server = rpc.Server;
      const mockSendTransaction = vi.fn().mockResolvedValue({ status: "PENDING", hash: "hash-1" });
      const mockGetTransaction = vi.fn().mockResolvedValue({
        status: "SUCCESS",
        resultXdr: { toXDR: () => "result-xdr" },
      });
      vi.mocked(server).mockImplementationOnce(function() {
        return {
          getAccount: vi.fn().mockResolvedValue({ accountId: validSourceAccount, sequenceNumber: "0" }),
          sendTransaction: mockSendTransaction,
          getTransaction: mockGetTransaction,
        } as unknown as rpc.Server;
      });

      const result = await fundEscrow(validContractId, ["arg"], validSourceAccount, "TESTNET");

      expect(result).toEqual({ hash: "hash-1", resultXdr: "result-xdr" });
      expect(freighter.signTransaction).toHaveBeenCalled();
      expect(mockGetTransaction).toHaveBeenCalledWith("hash-1");
    });

    it("propagates TxFailed errors", async () => {
      const server = rpc.Server;
      vi.mocked(server).mockImplementationOnce(function() {
        return {
          getAccount: vi.fn().mockResolvedValue({ accountId: validSourceAccount, sequenceNumber: "0" }),
          sendTransaction: vi.fn().mockResolvedValue({
            status: "ERROR",
            hash: "hash-err",
            errorResult: { result: () => ({ switch: () => ({ name: "TxFailed" }) }) },
          }),
          getTransaction: vi.fn(),
        } as unknown as rpc.Server;
      });

      await expect(fundEscrow(validContractId, [], validSourceAccount, "TESTNET"))
        .rejects.toThrow("TxFailed");
    });

    it("propagates TxExpired errors", async () => {
      const server = rpc.Server;
      vi.mocked(server).mockImplementationOnce(function() {
        return {
          getAccount: vi.fn().mockResolvedValue({ accountId: validSourceAccount, sequenceNumber: "0" }),
          sendTransaction: vi.fn().mockResolvedValue({ status: "PENDING", hash: "hash-2" }),
          getTransaction: vi.fn().mockResolvedValue({
            status: "FAILED",
            resultXdr: { result: () => ({ switch: () => ({ name: "TxExpired" }) }) },
          }),
        } as unknown as rpc.Server;
      });

      await expect(confirmDelivery(validContractId, [], validSourceAccount, "TESTNET"))
        .rejects.toThrow("TxExpired");
    });

    it("raises dispute through its contract method", async () => {
      const server = rpc.Server;
      vi.mocked(server).mockImplementationOnce(function() {
        return {
          getAccount: vi.fn().mockResolvedValue({ accountId: validSourceAccount, sequenceNumber: "0" }),
          sendTransaction: vi.fn().mockResolvedValue({ status: "PENDING", hash: "hash-2" }),
          getTransaction: vi.fn().mockResolvedValue({
            status: "SUCCESS",
            resultXdr: { toXDR: () => "result-xdr-2" },
          }),
        } as unknown as rpc.Server;
      });

      const result = await raiseDispute(validContractId, ["reason"], validSourceAccount, "TESTNET");

      expect(result).toEqual({ hash: "hash-2", resultXdr: "result-xdr-2" });
    });
  });

  describe("Soroban confirmation polling", () => {
    const validSourceAccount = VALID_SOURCE_ACCOUNT;
    const validContractId = VALID_CONTRACT_ID;

    function mockServer(overrides: Record<string, unknown>) {
      vi.mocked(rpc.Server).mockImplementationOnce(function () {
        return {
          getAccount: vi
            .fn()
            .mockResolvedValue({ accountId: validSourceAccount, sequenceNumber: "0" }),
          ...overrides,
        } as unknown as rpc.Server;
      });
    }

    it("polls a PENDING transaction until it succeeds", async () => {
      const getTransaction = vi
        .fn()
        .mockResolvedValueOnce({ status: "NOT_FOUND" })
        .mockResolvedValueOnce({ status: "PENDING" })
        .mockResolvedValueOnce({ status: "SUCCESS", resultXdr: "late-result" });

      mockServer({
        sendTransaction: vi
          .fn()
          .mockResolvedValue({ status: "PENDING", hash: "pending-hash" }),
        getTransaction,
      });

      const result = await fundEscrow(validContractId, [], validSourceAccount, "TESTNET");

      expect(result).toEqual({ hash: "pending-hash", resultXdr: "late-result" });
      expect(getTransaction).toHaveBeenCalledWith("pending-hash");
    });

    it("fails as soon as the polled transaction reports FAILED", async () => {
      const getTransaction = vi
        .fn()
        .mockResolvedValue({ status: "FAILED", errorResultXdr: "TxFailed: nope" });

      mockServer({
        sendTransaction: vi
          .fn()
          .mockResolvedValue({ status: "PENDING", hash: "doomed-hash" }),
        getTransaction,
      });

      await expect(
        fundEscrow(validContractId, [], validSourceAccount, "TESTNET")
      ).rejects.toThrow("TxFailed");
    });

    it("rejects a PENDING response with no hash", async () => {
      mockServer({
        sendTransaction: vi.fn().mockResolvedValue({ status: "PENDING" }),
        getTransaction: vi.fn(),
      });

      await expect(
        fundEscrow(validContractId, [], validSourceAccount, "TESTNET")
      ).rejects.toThrow("Pending transaction was submitted without a hash");
    });

    it("preserves the transaction hash when polling times out", async () => {
      const getTransaction = vi.fn().mockResolvedValue({ status: "PENDING" });

      mockServer({
        sendTransaction: vi
          .fn()
          .mockResolvedValue({ status: "PENDING", hash: "slow-hash" }),
        getTransaction,
      });

      vi.useFakeTimers();
      try {
        const pending = fundEscrow(validContractId, [], validSourceAccount, "TESTNET");
        const assertion = expect(pending).rejects.toThrow(
          TransactionConfirmationTimeoutError
        );

        await vi.advanceTimersByTimeAsync(120_000);
        await assertion;
      } finally {
        vi.useRealTimers();
      }

      expect(getTransaction).toHaveBeenCalled();
    });

    it("exposes the hash on the timeout error so it can be looked up", async () => {
      mockServer({
        sendTransaction: vi
          .fn()
          .mockResolvedValue({ status: "PENDING", hash: "lookup-me" }),
        getTransaction: vi.fn().mockResolvedValue({ status: "PENDING" }),
      });

      vi.useFakeTimers();
      let caught: unknown;
      try {
        const pending = fundEscrow(validContractId, [], validSourceAccount, "TESTNET");
        const assertion = pending.catch((error: unknown) => {
          caught = error;
        });

        await vi.advanceTimersByTimeAsync(120_000);
        await assertion;
      } finally {
        vi.useRealTimers();
      }

      expect(caught).toBeInstanceOf(TransactionConfirmationTimeoutError);
      const timeoutError = caught as InstanceType<typeof TransactionConfirmationTimeoutError>;
      expect(timeoutError.hash).toBe("lookup-me");
      expect(timeoutError.message).toContain("lookup-me");
      expect(timeoutError.attempts).toBeGreaterThan(0);
    });
  });

  describe("submitPayment", () => {
    const validSourceAccount = VALID_SOURCE_ACCOUNT;
    const validDestination = VALID_SOURCE_ACCOUNT;

    afterEach(() => {
      delete process.env.NEXT_PUBLIC_ESCROW_MOCK_PAYMENTS;
    });

    it("does not return a mock hash by default", async () => {
      const hash = await submitPayment("10", validDestination).catch(
        (error: Error) => error.message
      );

      expect(hash).toBe("sourceAccount is required to submit a payment");
      expect(hash).not.toContain("mock");
    });

    it("returns a deterministic mock hash only when the feature flag is on", async () => {
      process.env.NEXT_PUBLIC_ESCROW_MOCK_PAYMENTS = "true";

      expect(isMockPaymentsEnabled()).toBe(true);
      const first = await submitPayment("10", validDestination);
      const second = await submitPayment("10", validDestination);

      expect(first).toBe(second);
      expect(first.startsWith("mock-")).toBe(true);
    });

    it("ignores the flag for any value other than 'true'", async () => {
      process.env.NEXT_PUBLIC_ESCROW_MOCK_PAYMENTS = "1";

      expect(isMockPaymentsEnabled()).toBe(false);
      await expect(submitPayment("10", validDestination)).rejects.toThrow(
        "sourceAccount is required"
      );
    });

    it("lets a caller opt in per call without the env flag", async () => {
      const hash = await submitPayment("10", validDestination, { mock: true });

      expect(hash.startsWith("mock-")).toBe(true);
    });

    it("rejects a missing destination", async () => {
      await expect(submitPayment("10", "")).rejects.toThrow(
        "Destination address is required"
      );
    });

    it("rejects a destination that is not a valid account key", async () => {
      await expect(submitPayment("10", "C")).rejects.toThrow(
        "Invalid destination address"
      );
      await expect(submitPayment("10", "not-a-key")).rejects.toThrow(
        "Invalid destination address"
      );
    });

    it("rejects a malformed amount", async () => {
      for (const amount of ["", "0", "-1", "abc", "1.12345678", "1e5"]) {
        await expect(
          submitPayment(amount, validDestination, { mock: true })
        ).rejects.toThrow("Amount must be a positive number");
      }
    });

    it("accepts an amount with up to 7 decimals", async () => {
      await expect(
        submitPayment("1.1234567", validDestination, { mock: true })
      ).resolves.toContain("mock-");
    });

    it("rejects an invalid source account on the real path", async () => {
      await expect(
        submitPayment("10", validDestination, { sourceAccount: "not-a-key" })
      ).rejects.toThrow("Invalid source account public key");
    });

    it("submits and returns the network hash on the real path", async () => {
      const sendTransaction = vi
        .fn()
        .mockResolvedValue({ status: "PENDING", hash: "payment-hash" });

      vi.mocked(rpc.Server).mockImplementationOnce(function () {
        return {
          getAccount: vi
            .fn()
            .mockResolvedValue({ accountId: validSourceAccount, sequenceNumber: "0" }),
          sendTransaction,
        } as unknown as rpc.Server;
      });

      const hash = await submitPayment("12.5", validDestination, {
        sourceAccount: validSourceAccount,
        network: "PUBLIC",
      });

      expect(hash).toBe("payment-hash");
      expect(sendTransaction).toHaveBeenCalled();
      expect(freighter.signTransaction).toHaveBeenCalled();
    });

    it("propagates a failed submission on the real path", async () => {
      vi.mocked(rpc.Server).mockImplementationOnce(function () {
        return {
          getAccount: vi
            .fn()
            .mockResolvedValue({ accountId: validSourceAccount, sequenceNumber: "0" }),
          sendTransaction: vi
            .fn()
            .mockResolvedValue({ status: "FAILED", errorResultXdr: "TxFailed: no" }),
        } as unknown as rpc.Server;
      });

      await expect(
        submitPayment("12.5", validDestination, {
          sourceAccount: validSourceAccount,
        })
      ).rejects.toThrow("TxFailed");
    });
  });

  describe("Contract call construction integration", () => {
    const validSourceAccount = VALID_SOURCE_ACCOUNT;
    const validContractId = VALID_CONTRACT_ID;

    it("validates all components before building invocation", () => {
      const options: ContractCallOptions = {
        contractId: validContractId,
        method: "approve",
        args: ["recipient", "1000"],
        sourceAccount: validSourceAccount,
        network: "TESTNET",
      };

      // Validate components
      expect(isValidContractId(options.contractId)).toBe(true);
      const methodValidation = validateContractMethodCall(options.method, options.args);
      expect(methodValidation.valid).toBe(true);

      // Build invocation
      const xdr = buildContractInvocation(options);
      expect(xdr).toBeDefined();
    });

    it("handles contract result parsing after successful invocation", () => {
      const mockResponse = {
        success: true,
        result: { transactionHash: "abc123", status: "completed" },
      };

      expect(isContractSuccess(mockResponse)).toBe(true);
      const result = parseContractResult(mockResponse);
      expect(result).toEqual({ transactionHash: "abc123", status: "completed" });
    });

    it("handles error parsing after failed invocation", () => {
      const mockError = {
        type: "ContractError",
        details: "Insufficient funds",
      };

      const errorMessage = parseContractError(mockError);
      expect(errorMessage).toContain("Contract Error");
      expect(errorMessage).toContain("Insufficient funds");
    });
  });
});
