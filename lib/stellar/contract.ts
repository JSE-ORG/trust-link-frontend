"use client";

import {
  Asset,
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
import { getNetworkPassphrase } from "./networks";
import { pollWithBackoff } from "./poll";

/** Soroban contract calls can take a while to land — poll generously. */
const SOROBAN_POLL_TIMEOUT_MS = 60_000;

/**
 * Env flag that swaps {@link submitPayment} onto a fake-hash path. Off unless
 * explicitly enabled, so no deployment can return a mock hash by accident.
 */
const MOCK_PAYMENTS_FLAG = "NEXT_PUBLIC_ESCROW_MOCK_PAYMENTS";

/** True only when the deployment explicitly opts into mock payments. */
export function isMockPaymentsEnabled(): boolean {
  return process.env[MOCK_PAYMENTS_FLAG] === "true";
}

export interface SubmitPaymentOptions {
  /** Account the payment is sent from. Required on the real path. */
  sourceAccount?: string;
  network?: "TESTNET" | "PUBLIC";
  rpcUrl?: string;
  fee?: string;
  /** Overrides {@link isMockPaymentsEnabled} for this call. */
  mock?: boolean;
}

/** XLM amounts are 7 decimal places (stroops). */
const AMOUNT_PATTERN = /^\d+(?:\.\d{1,7})?$/;

/**
 * Thrown when a submitted transaction never leaves the pending state. The hash
 * is preserved so the caller can still look the transaction up on an explorer
 * or retry `getTransaction` with it.
 */
export class TransactionConfirmationTimeoutError extends Error {
  readonly hash: string;
  readonly attempts: number;

  constructor(hash: string, attempts: number) {
    super(
      `Transaction ${hash} was not confirmed after ${attempts} attempt(s)`
    );
    this.name = "TransactionConfirmationTimeoutError";
    this.hash = hash;
    this.attempts = attempts;
  }
}

/**
 * Sends a payment to a Stellar address.
 *
 * The real path builds, signs and submits a classic payment operation and
 * returns the network-assigned hash. A deterministic fake hash is only ever
 * returned when mock payments are explicitly enabled through
 * `NEXT_PUBLIC_ESCROW_MOCK_PAYMENTS=true` — see {@link isMockPaymentsEnabled}.
 *
 * @param {string} amount - Amount in XLM, at most 7 decimal places
 * @param {string} destination - Destination Stellar account (G...)
 * @param {SubmitPaymentOptions} [options] - Source account, network and RPC URL
 * @returns {Promise<string>} The transaction hash
 * @throws {Error} If destination address is empty or transaction fails
 * @example
 * const txHash = await submitPayment("100", "GDESTINATION...", {
 *   sourceAccount: "GSOURCE...",
 * });
 */
export async function submitPayment(
  amount: string,
  destination: string,
  options: SubmitPaymentOptions = {}
): Promise<string> {
  const {
    sourceAccount,
    network = "TESTNET",
    rpcUrl = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org",
    fee = BASE_FEE,
  } = options;
  const useMock = options.mock ?? isMockPaymentsEnabled();

  if (!destination) {
    throw new Error("Destination address is required");
  }

  if (!StrKey.isValidEd25519PublicKey(destination)) {
    throw new Error("Invalid destination address");
  }

  const normalizedAmount = typeof amount === "string" ? amount.trim() : "";
  if (!AMOUNT_PATTERN.test(normalizedAmount) || Number(normalizedAmount) <= 0) {
    throw new Error("Amount must be a positive number with up to 7 decimals");
  }

  if (useMock) {
    // Deterministic, clearly-synthetic hash. Never enabled unless the
    // deployment asked for it.
    return `mock-${normalizedAmount}-${destination.slice(0, 8)}-${network.toLowerCase()}`;
  }

  if (!sourceAccount) {
    throw new Error("sourceAccount is required to submit a payment");
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
        Operation.payment({
          destination,
          asset: Asset.native(),
          amount: normalizedAmount,
        }) as any
      )
      .setTimeout(30)
      .build();

    const signedXdr = await signTransaction(tx.toXDR(), networkPassphrase);
    const response = await server.sendTransaction(
      TransactionBuilder.fromXDR(signedXdr, networkPassphrase)
    );

    const status = (response as any)?.status;
    if (status === "ERROR" || status === "FAILED") {
      throw toTxError(
        (response as any)?.errorResultXdr || (response as any)?.error,
        "Transaction failed"
      );
    }

    const hash = (response as any)?.hash;
    if (!hash) {
      throw new Error("Transaction submission returned no hash");
    }

    return hash;
  } catch (error) {
    throw toTxError(error, "Transaction submission failed");
  }
  if (!destination || !destination.trim()) {
    throw new Error("Destination address is required");
  }

  // Feature flag check for mock payment in production
  const useMockPayment = process.env.NEXT_PUBLIC_USE_MOCK_PAYMENT === "true";
  
  if (useMockPayment) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return "b2d8e9f...a1c3b5d7";
  }

  // Real implementation would go here
  throw new Error("Payment submission not yet implemented");
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
    // Exponential backoff with jitter
    const backoff = intervalMs * Math.pow(1.5, attempts - remaining);
    const jitter = Math.random() * 200;
    await new Promise((resolve) => setTimeout(resolve, backoff + jitter));
    
    response = await server.getTransaction(hash);
    remaining -= 1;
  }

  // Even if timed out, preserve the hash for potential retry
  if (response.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
    const error = new Error(`Transaction ${hash} not found after ${attempts} attempts`) as Error & { hash?: string };
    error.hash = hash;
    throw error;
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

  if (!isValidContractId(contractId)) {
  if (!contractId || !StrKey.isValidContract(contractId)) {
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
    const status = (response as any)?.status;

    if (status === "ERROR" || status === "FAILED") {
      throw toTxError((response as any)?.errorResultXdr || (response as any)?.error, "Transaction failed");
    }

    if (status === "PENDING") {
      const hash = (response as any).hash;
      if (!hash) {
        throw new Error("Pending transaction was submitted without a hash");
      }

      // Poll with backoff + jitter. A timeout still surfaces the hash so the
      // transaction can be looked up instead of being lost.
      const txResponse = await pollWithBackoff({
        check: async () => {
          const polled = (await server.getTransaction(hash)) as any;
          if (polled?.status === "FAILED" || polled?.status === "ERROR") {
            throw toTxError(polled.errorResultXdr || polled.resultXdr, "Transaction failed");
          }
          return polled?.status === "SUCCESS" ? polled : null;
        },
        timeoutMs: SOROBAN_POLL_TIMEOUT_MS,
        onTimeout: (attempts) => new TransactionConfirmationTimeoutError(hash, attempts),
      });

      return {
        hash,
        resultXdr: txResponse?.resultXdr || "",
      };
    if (response.status === "ERROR") {
      throw toTxError(transactionResultCode(response.errorResult), "Transaction failed");
    }

    const txResponse = await pollTransaction(server, response.hash);

    if (txResponse.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw toTxError(transactionResultCode(txResponse.resultXdr), "Transaction failed");
    }

    if (txResponse.status === rpc.Api.GetTransactionStatus.NOT_FOUND) {
      const error = new Error(`Transaction ${response.hash} timed out waiting for inclusion in ledger`) as Error & { hash?: string };
      error.hash = response.hash;
      throw error;
    }

    return {
      hash: response.hash,
      resultXdr: txResponse.resultXdr.toXDR("base64"),
    };
  } catch (error) {
    if (error instanceof TransactionConfirmationTimeoutError) {
      throw error;
    }
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
  if (!isValidContractId(contractId)) {
  if (!contractId || !StrKey.isValidContract(contractId)) {
    throw new Error("Invalid contract ID");
  }

  if (!method) {
    throw new Error("Method name is required");
  }

  if (!StrKey.isValidEd25519PublicKey(sourceAccount)) {
    throw new Error("Invalid source account public key");
  }

  // Get network passphrase
  const networkPassphrase = getNetworkPassphrase(network);

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
 * Validate a contract ID
 *
 * A contract ID is a StrKey with the `C` version byte: 56 characters of
 * base32 with a CRC-16 checksum. Checking only the `C` prefix accepts typos and
 * truncated IDs such as `"C"`, which then fail deep inside the SDK.
 *
 * @param {string} contractId - The contract ID to validate
 * @returns {boolean} True if valid, false otherwise
 * @example
 * if (isValidContractId("CAAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQC526")) {
 *   buildContractInvocation({ contractId, ... });
 * }
 */
export function isValidContractId(contractId: string): boolean {
  if (typeof contractId !== "string" || contractId.length === 0) {
    return false;
  }
  
  // Use StrKey validation for proper contract ID verification
  try {
    return StrKey.isValidContract(contractId);
  } catch {
    return false;
  }
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

  const networkPassphrase = getNetworkPassphrase(network);

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
