import * as StellarSdk from "@stellar/stellar-sdk";
import { signTransaction } from "./freighter";

export interface ContractCallResult {
  hash: string;
  resultXdr: string;
}

export class TxFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TxFailedError";
  }
}

export class TxExpiredError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TxExpiredError";
  }
}

const DEFAULT_RPC_URL = process.env.NEXT_PUBLIC_SOROBAN_RPC_URL || "https://soroban-testnet.stellar.org";
const DEFAULT_NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK === "PUBLIC" ? StellarSdk.Networks.PUBLIC : StellarSdk.Networks.TESTNET;
const DEFAULT_FEE = "100";
const DEFAULT_TIMEOUT = 180;

interface BaseContractParams {
  contractId: string;
  publicKey: string;
  rpcUrl?: string;
  networkPassphrase?: string;
}

export interface FundEscrowParams extends BaseContractParams {
  escrowId: string;
  amount: string | number | bigint;
}

export interface ConfirmDeliveryParams extends BaseContractParams {
  escrowId: string;
}

export interface RaiseDisputeParams extends BaseContractParams {
  escrowId: string;
  reason: string;
}

const sdk: any = StellarSdk;
const xdr: any = sdk.xdr;

function rpcUrl(params?: { rpcUrl?: string }) {
  return params?.rpcUrl || DEFAULT_RPC_URL;
}

function networkPassphrase(params?: { networkPassphrase?: string }) {
  return params?.networkPassphrase || DEFAULT_NETWORK;
}

function buildScVal(value: unknown): any {
  if (typeof value === "bigint" || typeof value === "number" || typeof value === "string") {
    const stringValue = typeof value === "bigint" ? value.toString() : String(value);
    return xdr.ScVal.scvU64(xdr.Uint64.fromString(stringValue));
  }

  if (typeof value === "boolean") {
    return xdr.ScVal.scvBool(value);
  }

  if (value instanceof Uint8Array || Buffer.isBuffer(value)) {
    return xdr.ScVal.scvBytes(Buffer.from(value));
  }

  return xdr.ScVal.scvBytes(Buffer.from(String(value), "utf8"));
}

function decodeContractId(contractId: string): Buffer {
  const strkey: any = sdk.StrKey;
  if (typeof strkey.decodeContract === "function") {
    return Buffer.from(strkey.decodeContract(contractId));
  }
  if (typeof strkey.decodeEd25519PublicKey === "function") {
    return Buffer.from(strkey.decodeEd25519PublicKey(contractId));
  }
  throw new Error("Unable to decode contractId from Stellar SDK StrKey");
}

function buildInvokeHostFunction(contractId: string, functionName: string, args: unknown[]) {
  const contractHash = decodeContractId(contractId);
  const contractAddress = xdr.ScAddress.scAddressTypeContract(
    xdr.ScAddressContract.contractId(contractHash)
  );

  return xdr.HostFunction.hostFunctionTypeInvokeContract(
    new xdr.InvokeContractArgs({
      contractAddress,
      functionName: xdr.ScSymbol.fromString(functionName),
      args: args.map(buildScVal),
      auth: new xdr.Vec(),
    })
  );
}

async function loadSourceAccount(publicKey: string, rpcUrl: string): Promise<any> {
  const server = new sdk.SorobanServer(rpcUrl);
  const account = await server.getAccount(publicKey);
  return new sdk.Account(publicKey, account.sequence);
}

async function submitSorobanTransaction(signedXdr: string, rpcUrl: string): Promise<ContractCallResult> {
  const response = await fetch(rpcUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "send_transaction",
      params: {
        tx: signedXdr,
      },
    }),
  });

  const json = await response.json();

  const errorMessage = json?.error?.message ?? json?.error?.data?.message ?? json?.error;
  if (errorMessage) {
    const normalized = String(errorMessage).toLowerCase();
    if (normalized.includes("tx_failed")) {
      throw new TxFailedError(String(errorMessage));
    }
    if (normalized.includes("tx_expired") || normalized.includes("expired")) {
      throw new TxExpiredError(String(errorMessage));
    }
    throw new Error(String(errorMessage));
  }

  const result = json?.result;
  if (!result || !result.hash || !result.xdr) {
    throw new Error("Invalid Soroban RPC response");
  }

  return {
    hash: result.hash,
    resultXdr: result.xdr,
  };
}

async function buildAndSubmitContractCall(
  contractId: string,
  functionName: string,
  args: unknown[],
  params: BaseContractParams
): Promise<ContractCallResult> {
  const rpcEndpoint = rpcUrl(params);
  const network = networkPassphrase(params);
  const sourceAccount = await loadSourceAccount(params.publicKey, rpcEndpoint);
  const hostFunction = buildInvokeHostFunction(contractId, functionName, args);
  const operation = (sdk.Operation as any).invokeHostFunction({
    function: hostFunction,
    footprint: {
      readOnly: [],
      readWrite: [],
    },
  });

  const transaction = new sdk.TransactionBuilder(sourceAccount, {
    fee: DEFAULT_FEE,
    networkPassphrase: network,
  })
    .addOperation(operation)
    .setTimeout(DEFAULT_TIMEOUT)
    .build();

  const signedXdr = await signTransaction(transaction.toXDR(), network);
  return submitSorobanTransaction(signedXdr, rpcEndpoint);
}

export async function fundEscrow(params: FundEscrowParams): Promise<ContractCallResult> {
  return buildAndSubmitContractCall(params.contractId, "fundEscrow", [params.escrowId, params.amount], params);
}

export async function confirmDelivery(params: ConfirmDeliveryParams): Promise<ContractCallResult> {
  return buildAndSubmitContractCall(params.contractId, "confirmDelivery", [params.escrowId], params);
}

export async function raiseDispute(params: RaiseDisputeParams): Promise<ContractCallResult> {
  return buildAndSubmitContractCall(params.contractId, "raiseDispute", [params.escrowId, params.reason], params);
}
