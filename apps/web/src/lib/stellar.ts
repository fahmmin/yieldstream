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

export const USDC_ISSUER =
  process.env.NEXT_PUBLIC_USDC_ISSUER ??
  "GDJ7BKYQOP2TKEC5YVWPZRMLSR3NTEOLAZAUVVAE3ZB3BUJAT56TKQOJ";

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

/** Classic trustline required before SAC USDC transfer/mint. */
export async function hasUsdcTrustline(address: string): Promise<boolean> {
  try {
    const account = await getHorizon().loadAccount(address);
    return account.balances.some(
      (b) =>
        b.asset_type !== "native" &&
        "asset_code" in b &&
        b.asset_code === "USDC" &&
        b.asset_issuer === USDC_ISSUER,
    );
  } catch {
    return false;
  }
}

export function buildUsdcTrustOp(address: string) {
  if (!CONTRACTS.usdc) {
    throw new Error("USDC contract not configured");
  }
  return contractCall(
    CONTRACTS.usdc,
    "trust",
    nativeToScVal(address, { type: "address" }),
  );
}

export async function readUsdcBalance(address: string): Promise<bigint> {
  if (!CONTRACTS.usdc) return 0n;
  return readContractI128(CONTRACTS.usdc, "balance", address, address);
}

export function parseContractError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes("trustline entry is missing")) {
    return "USDC trustline missing — enable testnet USDC first, then retry.";
  }
  if (msg.includes("Error(Contract, #13)")) {
    return "Token trustline missing. Enable USDC on testnet before depositing.";
  }
  if (msg.includes("Error(Contract, #4)")) {
    return "Insufficient balance for this action.";
  }
  if (msg.includes("Error(Contract, #7)")) {
    return "Principal is hard-locked until maturity — early withdrawal is not available.";
  }
  if (msg.includes("Error(Contract, #8)")) {
    return "Monthly yield payout is not due yet.";
  }
  if (msg.includes("USER_REJECTED") || msg.includes("User declined")) {
    return "Transaction cancelled in wallet.";
  }
  return msg;
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
  addressArg?: string,
): Promise<boolean> {
  const server = getServer();
  const account = await simulationAccount(source);
  const args = addressArg ? [nativeToScVal(addressArg, { type: "address" })] : [];
  const tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(contractCall(contractId, fn, ...args))
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

export async function readContractI128Args(
  contractId: string,
  fn: string,
  args: xdr.ScVal[] = [],
  source?: string,
): Promise<bigint> {
  const server = getServer();
  const account = await simulationAccount(source);
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
