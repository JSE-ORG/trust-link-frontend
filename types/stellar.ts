import type { rpc, xdr } from "@stellar/stellar-sdk";

/**
 * Stellar network identifier used across the app.
 */
export type StellarNetwork = "TESTNET" | "PUBLIC";

/**
 * Allowed argument types for Soroban contract invocations.
 * Mirrors the union accepted by `nativeToScVal` and raw `xdr.ScVal` values.
 */
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

/**
 * Options for building a contract invocation transaction (offline, no RPC).
 */
export interface ContractCallOptions {
  contractId: string;
  method: string;
  args: ContractArg[];
  sourceAccount: string;
  network: StellarNetwork;
  fee?: string;
}

/**
 * Options for invoking a Soroban contract via RPC (online).
 */
export interface SorobanContractCallOptions {
  contractId: string;
  method: string;
  args?: ContractArg[];
  sourceAccount: string;
  network?: StellarNetwork;
  rpcUrl?: string;
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

/**
 * Narrowed error shape returned from contract invocations.
 * Uses `unknown` for message fields to preserve type safety.
 */
export type ContractErrorResponse = {
  message?: unknown;
  type?: unknown;
  details?: unknown;
};

export type ContractResultResponse<TResult> = {
  result?: TResult;
  value?: TResult;
};

/**
 * Re-exported Stellar SDK response types for consumers that need explicit typing
 * instead of `any`. These are the canonical types for Soroban RPC interactions.
 */
export type GetTransactionResponse = rpc.Api.GetTransactionResponse;
export type SendTransactionResponse = rpc.Api.SendTransactionResponse;
export type GetTransactionStatus = rpc.Api.GetTransactionStatus;
