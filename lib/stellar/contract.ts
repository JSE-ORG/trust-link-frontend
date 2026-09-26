"use client";

import {
  Account,
  BASE_FEE,
  Contract,
  nativeToScVal,
  Networks,
  Operation,
  rpc,
  StrKey,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";

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
 * // Use txHash for transaction tracking or UI display
 */
export async function submitPayment(
  amount: string,
  destination: string
): Promise<string> {
  // In a real implementation, this would involve building a transaction
  // and using signTransaction(xdr, network)
  
  // Simulated delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Let's assume some validation error for empty destination
  if (!destination) {
    throw new Error("Destination address is required");
  }

  return "b2d8e9f...a1c3b5d7";
}

export type ContractArg =
  | xdr.ScVal
  | string
  | number
  | boolean
  | bigint
  | Buffer
  | Uint8Array
  | { [key: string]: ContractArg }
  | ContractArg[];

export interface ContractCallOptions {
  contractId: string;
  method: string;
  args: ContractArg[];
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
  result?: xdr.ScVal;
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
  args?: ContractArg[];
  sourceAccount: string;
  network?: "TESTNET" | "PUBLIC";
  rpcUrl?: string;
  fee?: string;
}

type ContractErrorResponse = {
  message?: unknown;
  type?: unknown;
  details?: unknown;
};

type ContractResultResponse<TResult> = {
  result?: TResult;
  value?: TResult;
};

function isRecord(value: unknown): value is Record<PropertyKey, unknown> {
  return typeof value === "object" && value !== null;
}

function getNetworkPassphrase(
  network: "TESTNET" | "PUBLIC"
): typeof Networks.PUBLIC | typeof Networks.TESTNET {
  return network === "PUBLIC"
    ? Networks.PUBLIC
    : Networks.TESTNET;
}

/** Converts a {@link ContractArg} into the `xdr.ScVal` the Soroban SDK operations require. */
function toScVal(arg: ContractArg): xdr.ScVal {
  return arg instanceof xdr.ScVal ? arg : nativeToScVal(arg);
}

/** Best-effort extraction of the XDR result-code name (e.g. `"txFAILED"`) from a transaction result. */
function transactionResultCode(result?: xdr.TransactionResult): string | undefined {
  try {
    return result?.result().switch().name;
  } catch {
    return undefined;
  }
}

/**
 * Polls `getTransaction` until the transaction leaves the `NOT_FOUND` state
 * (i.e. the submitting ledger has closed) or the attempt budget is spent.
 */
async function pollTransaction(
  server: rpc.Server,
  hash: string,
  { attempts = 10, intervalMs = 1000 }: { attempts?: number; intervalMs?: number } = {}
): Promise<rpc.Api.GetTransactionResponse> {
  let response = await server.getTransaction(hash);
  let remaining = attempts;

  while (response.status === rpc.Api.GetTransactionStatus.NOT_FOUND && remaining > 0) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    response = await server.getTransaction(hash);
    remaining -= 1;
  }

  return response;
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
    const tx = new TransactionBuilder(account, {
      fee,
      networkPassphrase,
    })
      .addOperation(
        Operation.invokeContractFunction({
          contract: contractId,
          function: method,
          args: args.map(toScVal),
        })
      )
      .setTimeout(30)
      .build();

    const signedXdr = await signTransaction(tx.toXDR(), networkPassphrase);
    const response = await server.sendTransaction(
      TransactionBuilder.fromXDR(signedXdr, networkPassphrase)
    );

    if (response.status === "ERROR") {
      throw toTxError(transactionResultCode(response.errorResult), "Transaction failed");
    }

    const txResponse = await pollTransaction(server, response.hash);

    if (txResponse.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw toTxError(transactionResultCode(txResponse.resultXdr), "Transaction failed");
    }

    if (txResponse.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
      throw toTxError(undefined, "Timed out waiting for transaction to be included in a ledger");
    }

    return {
      hash: response.hash,
      resultXdr: txResponse.resultXdr.toXDR("base64"),
    };
  } catch (error) {
    throw toTxError(error, "Transaction submission failed");
  }
}

export async function fundEscrow(
  contractId: string,
  args: ContractArg[],
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
  args: ContractArg[],
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
  args: ContractArg[],
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

  // Placeholder account (sequence 0) for transaction building.
  // In real usage, this would be fetched from the network via server.getAccount().
  const account = new Account(sourceAccount, "0");

  // Build transaction with contract invocation
  const transaction = new TransactionBuilder(account, {
    fee,
    networkPassphrase,
  })
    .addOperation(contract.call(method, ...args.map(toScVal)))
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
 *   buildContractInvocation({ contractId: "CXXXXXX...", ... });
 * }
 */
export function isValidContractId(contractId: string): boolean {
  return typeof contractId === "string" && contractId.startsWith("C");
}

/**
 * Parse contract error response
 * @param {unknown} error - The error from contract invocation
 * @returns {string} Formatted error message
 * @example
 * try {
 *   await invokeContract();
 * } catch (error) {
 *   const message = parseContractError(error);
 *   alert(message);
 * }
 */
export function parseContractError(error: unknown): string {
  if (typeof error === "string") {
    return error;
  }

  if (!isRecord(error)) {
    return "An unknown error occurred";
  }

  const contractError = error as ContractErrorResponse;

  if (contractError.message) {
    return String(contractError.message);
  }

  if (contractError.type === "ContractError") {
    return `Contract Error: ${String(contractError.details ?? "Unknown error")}`;
  }

  return "An unknown error occurred";
}

/**
 * Extract result from contract response
 * @param {unknown} response - The contract response
 * @returns Parsed result or null
 * @param {ContractInvocationResult} response - The contract response
 * @returns {xdr.ScVal | null} Parsed result or null
 * @example
 * const response = await invokeContract();
 * const result = parseContractResult(response);
 * if (result) {
 *   // Process contract return value
 * }
 */
export function parseContractResult<TResult = unknown>(
  response: ContractResultResponse<TResult> | TResult | null | undefined
): TResult | null {
  if (!response) {
    return null;
  }

  if (!isRecord(response)) {
    return response;
  }

  const contractResponse = response as ContractResultResponse<TResult>;

  // Handle different response formats
  if (contractResponse.result !== undefined) {
    return contractResponse.result;
  }

  if (contractResponse.value !== undefined) {
    return contractResponse.value;
  }

  return response as TResult;
}

/**
 * Validate contract method parameters
 * @param {string} method - Method name
 * @param {ContractArg[]} args - Method arguments
 * @returns {{ valid: boolean; error?: string }} Validation result with error message if invalid
 * @example
 * const validation = validateContractMethodCall("transfer", [from, to, amount]);
 * if (!validation.valid) {
 *   console.error(validation.error);
 * }
 */
export function validateContractMethodCall(
  method: string,
  args: ContractArg[]
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

  // Placeholder account (sequence 0) for transaction building.
  // In real usage, this would be fetched from the network via server.getAccount().
  const account = new Account(sourceAccount, "0");

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(
      Operation.uploadContractWasm({
        wasm: wasmBuffer,
      })
    )
    .setTimeout(30)
    .build();

  return transaction.toXDR();
}

/**
 * Check if a response indicates successful contract execution
 * @param {unknown} response - Contract response
 * @returns {boolean} True if successful
 * @example
 * const response = await invokeContract();
 * if (isContractSuccess(response)) {
 *   // Handle successful contract execution
 * }
 */
export function isContractSuccess(response: unknown): boolean {
  if (!response || typeof response !== "object") {
    return false;
  }

  const obj = response as Record<string, unknown>;

  if (obj.success === false) {
    return false;
  }

  if (obj.success === true) {
    return true;
  }

  if (obj.error !== null && obj.error !== undefined) {
    return false;
  }

  return true;
}
