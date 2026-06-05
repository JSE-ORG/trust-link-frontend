import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  buildContractInvocation,
  isValidContractId,
  parseContractError,
  parseContractResult,
  validateContractMethodCall,
  buildContractDeployment,
  isContractSuccess,
  ContractCallOptions,
} from "./contract";

// Mock Stellar SDK
vi.mock("@stellar/stellar-sdk", () => {
  return {
    Contract: vi.fn().mockImplementation(function(id) {
      return {
        id,
        call: vi.fn().mockReturnValue({ type: "invocation" }),
      };
    }),
    Keypair: { random: vi.fn() },
    TransactionBuilder: vi.fn().mockImplementation(function() {
      return {
        addOperation: vi.fn().mockReturnThis(),
        setTimeout: vi.fn().mockReturnThis(),
        build: vi.fn().mockReturnValue({
          toXDR: vi.fn().mockReturnValue("mock-xdr-string"),
        }),
      };
    }),
    Networks: {
      PUBLIC_NETWORK_PASSPHRASE: "Public Global Stellar Network ; September 2015",
      TESTNET_NETWORK_PASSPHRASE: "Test SDF Network ; September 2015",
    },
    Operation: {
      invokeHostFunction: vi.fn().mockReturnValue({}),
      extendFootprintTtl: vi.fn().mockReturnValue({}),
    },
    xdr: {},
    BASE_FEE: "100",
    StrKey: {
      isValidEd25519PublicKey: vi.fn((key) => typeof key === "string" && key.startsWith("G") && key.length === 56),
    },
  };
});

describe("lib/stellar/contract.ts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("buildContractInvocation", () => {
    const validSourceAccount = "GBRPYHIL2CI3WHZDTOOQFC6EB4RRQQ5O5L3RHODOXJWYDOGNXVFC3J3A";
    const validContractId = "CCCZQVD4JFF2Z56XDQY2XHXGTWHBZWBRWQJL4QBFQZR77EAPBFQWKQ6S";

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
      expect(isValidContractId("CCCZQVD4JFF2Z56XDQY2XHXGTWHBZWBRWQJL4QBFQZR77EAPBFQWKQ6S")).toBe(true);
    });

    it("returns false for non-string input", () => {
      expect(isValidContractId(null as any)).toBe(false);
      expect(isValidContractId(undefined as any)).toBe(false);
      expect(isValidContractId(123 as any)).toBe(false);
    });

    it("returns false when not starting with C", () => {
      expect(isValidContractId("GBRPYHIL2CI3WHZDTOOQFC6EB4RRQQ5O5L3RHODOXJWYDOGNXVFC3J3")).toBe(false);
      expect(isValidContractId("INVALID")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isValidContractId("")).toBe(false);
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
      const result = validateContractMethodCall(null as any, []);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("non-empty string");
    });

    it("rejects empty method name", () => {
      const result = validateContractMethodCall("", []);
      expect(result.valid).toBe(false);
      expect(result.error).toContain("non-empty string");
    });

    it("rejects non-array arguments", () => {
      const result = validateContractMethodCall("transfer", "not-an-array" as any);
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
    const validSourceAccount = "GBRPYHIL2CI3WHZDTOOQFC6EB4RRQQ5O5L3RHODOXJWYDOGNXVFC3J3A";
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
      expect(() => buildContractDeployment(null as any, validSourceAccount, "TESTNET")).toThrow(
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

  describe("Contract call construction integration", () => {
    const validSourceAccount = "GBRPYHIL2CI3WHZDTOOQFC6EB4RRQQ5O5L3RHODOXJWYDOGNXVFC3J3A";
    const validContractId = "CCCZQVD4JFF2Z56XDQY2XHXGTWHBZWBRWQJL4QBFQZR77EAPBFQWKQ6S";

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
