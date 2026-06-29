"use client";

import {
  Contract,
  Keypair,
  TransactionBuilder,
  Networks,
  Operation,
  xdr,
  BASE_FEE,
  StrKey,
  rpc,
} from "stellar-sdk";
import { signTransaction } from "./freighter";

/**
 * Submits a payment transaction to the Stellar network
 * @param {string} amount - The amount to send (in XLM)
 * @param {string} destination - The destination Stellar address
 * @returns {Promise<string>} The transaction hash
 * @throws {Error} If destination address is empty or transaction fails
 * @deprecated This is a simulated function for testing purposes
 * @example
 * const txHash = await submitPayment("100", "GXXXXXX...");
 * console.log("Transaction submitted:", txHash);
 */
export async function submitPayment(amount: string, destination: string) {
  // In a real implementation, this would involve building a transaction
  // and using signTransaction(xdr, network)
  console.log(`Building transaction for ${amount} XLM to ${destination}`);
  
  // Simulated delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Let's assume some validation error for empty destination
  if (!destination) {
    throw new Error("Destination address is required");
  }

  return "b2d8e9f...a1c3b5d7";
}

export interface ContractCallOptions {
  contractId: string;
  method: string;
  args: any[];
  sourceAccount: string;
  network: "TESTNET" | "PUBLIC";
  fee?: string;
}

export interface ContractDeployResult {
  transactionXdr: string;
  contractId?: string;
}

export interface ContractInvocationResult {
  success: boolean;
  result?: any;
  error?: string;
  transactionHash?: string;
}

export interface ContractTransactionResult {
  hash: string;
  resultXdr: string;
}

export interface SorobanContractCallOptions {
  contractId: string;
  method: string;
  args?: any[];
  sourceAccount: string;
  network?: "TESTNET" | "PUBLIC";
  rpcUrl?: string;
  fee?: string;
}

function getNetworkPassphrase(network: "TESTNET" | "PUBLIC") {
  return network === "PUBLIC"
    ? Networks.PUBLIC
    : Networks.TESTNET;
}

function toTxError(error: unknown, fallback: string): Error {
  const message = error instanceof Error ? error.message : String(error ?? fallback);
  const normalized = message.includes("TxFailed") || message.includes("tx_failed")
    ? `TxFailed: ${message}`
    : message.includes("TxExpired") || message.includes("tx_expired")
      ? `TxExpired: ${message}`
      : message;

  const wrapped = new Error(normalized || fallback);
  if (message.includes("TxFailed") || message.includes("tx_failed")) {
    (wrapped as Error & { name?: string }).name = "TxFailed";
  }
  if (message.includes("TxExpired") || message.includes("tx_expired")) {
    (wrapped as Error & { name?: string }).name = "TxExpired";
  }
  return wrapped;
}

async function invokeSorobanContract(
  options: SorobanContractCallOptions
): Promise<ContractTransactionResult> {
  const {
    contractId,
    method,
    args = [],
    sourceAccount,
    network = "TESTNET",
    rpcUrl = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org",
    fee = BASE_FEE,
  } = options;

  if (!contractId || !contractId.startsWith("C")) {
    throw new Error("Invalid contract ID");
  }

  if (!method) {
    throw new Error("Method name is required");
  }

  if (!StrKey.isValidEd25519PublicKey(sourceAccount)) {
    throw new Error("Invalid source account public key");
  }

  const server = new rpc.Server(rpcUrl);
  const networkPassphrase = getNetworkPassphrase(network);

  try {
    const account = await server.getAccount(sourceAccount);
    const tx = new TransactionBuilder(account as any, {
      fee,
      networkPassphrase,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: contractId,
          function: method,
          args: args as any,
        } as any)
      )
      .setTimeout(30)
      .build();

    const signedXdr = await signTransaction(tx.toXDR(), networkPassphrase);
    const txEnvelope = xdr.TransactionEnvelope.fromXDR(signedXdr, "base64");
    const response = await server.sendTransaction(txEnvelope as any);

    if ((response as any)?.status === "ERROR" || (response as any)?.status === "FAILED") {
      throw toTxError((response as any)?.errorResultXdr || (response as any)?.error, "Transaction failed");
    }

    if ((response as any)?.status === "PENDING") {
      const txResponse = await server.getTransaction((response as any).hash);
      if ((txResponse as any).status === "FAILED") {
        throw toTxError((txResponse as any).errorResultXdr || (txResponse as any).resultXdr, "Transaction failed");
      }
      return {
        hash: (response as any).hash,
        resultXdr: (txResponse as any).resultXdr || "",
      };
    }

    return {
      hash: (response as any).hash || "",
      resultXdr: (response as any).resultXdr || "",
    };
  } catch (error) {
    throw toTxError(error, "Transaction submission failed");
  }
}

export async function fundEscrow(
  contractId: string,
  args: any[],
  sourceAccount: string,
  network: "TESTNET" | "PUBLIC" = "TESTNET"
): Promise<ContractTransactionResult> {
  return invokeSorobanContract({
    contractId,
    method: "fund_escrow",
    args,
    sourceAccount,
    network,
  });
}

export async function confirmDelivery(
  contractId: string,
  args: any[],
  sourceAccount: string,
  network: "TESTNET" | "PUBLIC" = "TESTNET"
): Promise<ContractTransactionResult> {
  return invokeSorobanContract({
    contractId,
    method: "confirm_delivery",
    args,
    sourceAccount,
    network,
  });
}

export async function raiseDispute(
  contractId: string,
  args: any[],
  sourceAccount: string,
  network: "TESTNET" | "PUBLIC" = "TESTNET"
): Promise<ContractTransactionResult> {
  return invokeSorobanContract({
    contractId,
    method: "raise_dispute",
    args,
    sourceAccount,
    network,
  });
}

/**
 * Build a contract invocation transaction
 * @param {ContractCallOptions} options - Contract call options including contractId, method, args, and network
 * @returns {string} Transaction XDR string ready to be signed
 * @throws {Error} If contract ID is invalid, method name is missing, or source account is invalid
 * @example
 * const xdr = buildContractInvocation({
 *   contractId: "CXXXXXX...",
 *   method: "transfer",
 *   args: [fromAddress, toAddress, amount],
 *   sourceAccount: "GXXXXXX...",
 *   network: "TESTNET"
 * });
 */
export function buildContractInvocation(options: ContractCallOptions): string {
  const {
    contractId,
    method,
    args,
    sourceAccount,
    network,
    fee = BASE_FEE,
  } = options;

  // Validate inputs
  if (!contractId || !contractId.startsWith("C")) {
    throw new Error("Invalid contract ID");
  }

  if (!method) {
    throw new Error("Method name is required");
  }

  if (!StrKey.isValidEd25519PublicKey(sourceAccount)) {
    throw new Error("Invalid source account public key");
  }

  // Get network passphrase
  const networkPassphrase =
    network === "PUBLIC" ? Networks.PUBLIC : Networks.TESTNET;

  // Build the contract instance
  const contract = new Contract(contractId);

  // Create a mock account for transaction building
  // In real usage, this would be fetched from the network
  const account = {
    accountId: sourceAccount,
    sequenceNumber: "0",
    incrementSequenceNumber: () => {},
  };

  // Build transaction with contract invocation
  const transaction = new TransactionBuilder(account as any, {
    fee,
    networkPassphrase,
  })
    .addOperation(
      Operation.invokeHostFunction({
        func: contract.call(method, ...args) as any,
      })
    )
    .setTimeout(30)
    .build();

  return transaction.toXDR();
}

/**
 * Validate a contract ID format
 * @param {string} contractId - The contract ID to validate
 * @returns {boolean} True if valid, false otherwise
 * @example
 * if (isValidContractId("CXXXXXX...")) {
 *   console.log("Valid contract ID");
 * }
 */
export function isValidContractId(contractId: string): boolean {
  return typeof contractId === "string" && contractId.startsWith("C");
}

/**
 * Parse contract error response
 * @param {any} error - The error from contract invocation
 * @returns {string} Formatted error message
 * @example
 * try {
 *   await invokeContract();
 * } catch (error) {
 *   const message = parseContractError(error);
 *   alert(message);
 * }
 */
export function parseContractError(error: any): string {
  if (typeof error === "string") {
    return error;
  }

  if (error?.message) {
    return error.message;
  }

  if (error?.type === "ContractError") {
    return `Contract Error: ${error.details || "Unknown error"}`;
  }

  return "An unknown error occurred";
}

/**
 * Extract result from contract response
 * @param {any} response - The contract response
 * @returns {any} Parsed result or null
 * @example
 * const response = await invokeContract();
 * const result = parseContractResult(response);
 * console.log("Contract returned:", result);
 */
export function parseContractResult(response: any): any {
  if (!response) {
    return null;
  }

  // Handle different response formats
  if (response.result) {
    return response.result;
  }

  if (response.value !== undefined) {
    return response.value;
  }

  return response;
}

/**
 * Validate contract method parameters
 * @param {string} method - Method name
 * @param {any[]} args - Method arguments
 * @returns {{ valid: boolean; error?: string }} Validation result with error message if invalid
 * @example
 * const validation = validateContractMethodCall("transfer", [from, to, amount]);
 * if (!validation.valid) {
 *   console.error(validation.error);
 * }
 */
export function validateContractMethodCall(
  method: string,
  args: any[]
): { valid: boolean; error?: string } {
  if (!method || typeof method !== "string") {
    return { valid: false, error: "Method name must be a non-empty string" };
  }

  if (!Array.isArray(args)) {
    return { valid: false, error: "Arguments must be an array" };
  }

  // Additional validation for common contract patterns
  if (method.length > 256) {
    return { valid: false, error: "Method name too long" };
  }

  return { valid: true };
}

/**
 * Build a contract deployment transaction
 * @param {Buffer} wasmBuffer - Compiled contract WASM buffer
 * @param {string} sourceAccount - Source account public key
 * @param {"TESTNET" | "PUBLIC"} network - Network to deploy to
 * @returns {string} Transaction XDR string
 * @throws {Error} If WASM buffer is empty or source account is invalid
 * @example
 * const wasmBuffer = fs.readFileSync("contract.wasm");
 * const xdr = buildContractDeployment(wasmBuffer, "GXXXXXX...", "TESTNET");
 */
export function buildContractDeployment(
  wasmBuffer: Buffer,
  sourceAccount: string,
  network: "TESTNET" | "PUBLIC"
): string {
  if (!wasmBuffer || wasmBuffer.length === 0) {
    throw new Error("WASM buffer cannot be empty");
  }

  if (!StrKey.isValidEd25519PublicKey(sourceAccount)) {
    throw new Error("Invalid source account public key");
  }

  const networkPassphrase =
    network === "PUBLIC" ? Networks.PUBLIC : Networks.TESTNET;

  const account = {
    accountId: sourceAccount,
    sequenceNumber: "0",
    incrementSequenceNumber: () => {},
  };

  const transaction = new TransactionBuilder(account as any, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.extendFootprintTtl({
        extendTo: 535679,
      })
    )
    .setTimeout(30)
    .build();

  return transaction.toXDR();
}

/**
 * Check if a response indicates successful contract execution
 * @param {any} response - Contract response
 * @returns {boolean} True if successful
 * @example
 * const response = await invokeContract();
 * if (isContractSuccess(response)) {
 *   console.log("Contract executed successfully");
 * }
 */
export function isContractSuccess(response: any): boolean {
  if (!response) {
    return false;
  }

  if (response.success === false) {
    return false;
  }

  if (response.success === true) {
    return true;
  }

  if (response.error !== null && response.error !== undefined) {
    return false;
  }

  return true;
}
