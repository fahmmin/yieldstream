import "dotenv/config";
import {
  Contract,
  Keypair,
  Networks,
  rpc,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import { loadAnchorConfig, routeYieldToInrBank } from "./anchor.js";
import { runMonthlyPayouts } from "./monthly-payout.js";

const RPC_URL = process.env.SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
const PASSPHRASE = process.env.STELLAR_NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;
const SECRET = process.env.KEEPER_SECRET_KEY ?? "";
const SY_VAULT = process.env.SY_VAULT_ID ?? "";
const MARKET = process.env.MARKET_ID ?? "";
const POLL_MS = Number(process.env.KEEPER_POLL_MS ?? 60_000);
const ANCHOR_ENABLED = process.env.ANCHOR_ROUTING_ENABLED === "true";
const MONTHLY_PAYOUT_ENABLED = process.env.MONTHLY_PAYOUT_ENABLED === "true";

function log(scope: string, message: string, data?: Record<string, unknown>) {
  console.log(
    JSON.stringify({
      ts: new Date().toISOString(),
      scope,
      message,
      ...data,
    }),
  );
}

function call(contractId: string, fn: string, ...args: xdr.ScVal[]) {
  return new Contract(contractId).call(fn, ...args);
}

async function sendTx(
  server: rpc.Server,
  source: Keypair,
  op: xdr.Operation,
  label: string,
) {
  const acct = await server.getAccount(source.publicKey());
  let tx = new TransactionBuilder(acct, {
    fee: "500000",
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(120)
    .build();
  tx = await server.prepareTransaction(tx);
  tx.sign(source);
  const result = await server.sendTransaction(tx);
  log("keeper", label, { hash: result.hash, status: result.status });
  return result;
}

async function extendTtl(server: rpc.Server, keeper: Keypair) {
  if (!SY_VAULT) return;
  await sendTx(
    server,
    keeper,
    call(SY_VAULT, "total_assets"),
    "ttl_ping_vault",
  );
  log("keeper", "ttl_extend_scheduled", { contracts: [SY_VAULT, MARKET] });
}

async function sweepMaturity(server: rpc.Server, keeper: Keypair) {
  if (!MARKET) return;
  const ledger = (await server.getLatestLedger()).sequence;
  log("keeper", "maturity_check", { ledger });
  await sendTx(server, keeper, call(MARKET, "sweep_matured"), "sweep_matured");
}

/** Phase 5: Blend/DeFindex adapter hook — swap fixed-rate accrual when enabled */
async function blendAdapterSync() {
  if (process.env.BLEND_ADAPTER_ENABLED !== "true") {
    log("blend", "adapter_disabled", { hint: "Set BLEND_ADAPTER_ENABLED=true after Phase 5 deploy" });
    return;
  }
  log("blend", "adapter_sync_skipped", {
    reason: "Deploy blend-adapter contract and set BLEND_POOL_ID to enable variable yield",
    pool: process.env.BLEND_POOL_ID ?? "",
  });
}

/** Phase 6: When YT claimable exceeds threshold, route to anchor off-ramp */
async function anchorRoutingCheck(server: rpc.Server, keeper: Keypair) {
  if (!ANCHOR_ENABLED || !MARKET) {
    log("anchor", "routing_disabled");
    return;
  }
  const cfg = loadAnchorConfig();
  const result = await routeYieldToInrBank(
    cfg,
    keeper.publicKey(),
    cfg.withdrawThresholdUsdc,
  );
  log("anchor", "routing_status", { status: result.status, reason: result.reason });
  void server;
}

/** Model A: batch monthly upfront yield for registered users */
async function monthlyPayoutCheck(server: rpc.Server, keeper: Keypair) {
  if (!MONTHLY_PAYOUT_ENABLED) {
    log("payout", "monthly_disabled");
    return;
  }
  await runMonthlyPayouts(server, keeper);
}

async function tick(server: rpc.Server, keeper: Keypair) {
  await extendTtl(server, keeper);
  try {
    await sweepMaturity(server, keeper);
  } catch (e) {
    log("keeper", "sweep_not_ready", { error: String(e) });
  }
  await blendAdapterSync();
  await monthlyPayoutCheck(server, keeper);
  await anchorRoutingCheck(server, keeper);
}

async function main() {
  if (!SECRET) {
    console.error("KEEPER_SECRET_KEY required in services/keeper/.env");
    process.exit(1);
  }
  const keeper = Keypair.fromSecret(SECRET);
  const server = new rpc.Server(RPC_URL);
  log("keeper", "started", {
    pubkey: keeper.publicKey(),
    rpc: RPC_URL,
    market: MARKET,
    vault: SY_VAULT,
  });
  for (;;) {
    try {
      await tick(server, keeper);
    } catch (e) {
      log("keeper", "tick_error", { error: String(e) });
    }
    await new Promise((r) => setTimeout(r, POLL_MS));
  }
}

main();
