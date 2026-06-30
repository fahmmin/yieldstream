import {
  Contract,
  Horizon,
  nativeToScVal,
  Networks,
  rpc,
  scValToNative,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";

export const NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet";
export const RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ??
  "https://soroban-testnet.stellar.org";
export const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL ??
  "https://horizon-testnet.stellar.org";

export const PASSPHRASE =
  NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;

export const CONTRACTS = {
  syVault: process.env.NEXT_PUBLIC_SY_VAULT_ID ?? "",
  market: process.env.NEXT_PUBLIC_MARKET_ID ?? "",
  ptToken: process.env.NEXT_PUBLIC_PT_TOKEN_ID ?? "",
  ytToken: process.env.NEXT_PUBLIC_YT_TOKEN_ID ?? "",
  usdc: process.env.NEXT_PUBLIC_USDC_ID ?? "",
};

export function isConfigured(): boolean {
  return Boolean(CONTRACTS.syVault && CONTRACTS.market);
}

export function getServer(): rpc.Server {
  return new rpc.Server(RPC_URL, { allowHttp: NETWORK === "local" });
}

export function getHorizon(): Horizon.Server {
  return new Horizon.Server(HORIZON_URL);
}

export function formatAmount(amount: string | number, decimals = 7): string {
  const n = Number(amount) / 10 ** decimals;
  return n.toLocaleString(undefined, { maximumFractionDigits: decimals });
}

export function contractCall(
  contractId: string,
  fn: string,
  ...args: xdr.ScVal[]
) {
  return new Contract(contractId).call(fn, ...args);
}

async function simulationAccount(preferred?: string) {
  const server = getServer();
  const id =
    preferred ?? "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
  return server.getAccount(id);
}

export async function readContractBool(
  contractId: string,
  fn: string,
  source?: string,
): Promise<boolean> {
  const server = getServer();
  const account = await simulationAccount(source);
  const tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(contractCall(contractId, fn))
    .setTimeout(30)
    .build();
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    return false;
  }
  const val =
    "result" in sim && sim.result?.retval ? sim.result.retval : undefined;
  return val ? Boolean(scValToNative(val)) : false;
}

export async function readContractI128(
  contractId: string,
  fn: string,
  arg?: string,
  source?: string,
): Promise<bigint> {
  const server = getServer();
  const account = await simulationAccount(source);
  const args = arg ? [nativeToScVal(arg, { type: "address" })] : [];
  const tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(contractCall(contractId, fn, ...args))
    .setTimeout(30)
    .build();
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) {
    throw new Error(sim.error);
  }
  const val =
    "result" in sim && sim.result?.retval ? sim.result.retval : undefined;
  return val ? BigInt(scValToNative(val) as string | number) : 0n;
}
