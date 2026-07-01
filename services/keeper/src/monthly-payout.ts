import "dotenv/config";
import {
  Contract,
  Keypair,
  nativeToScVal,
  Networks,
  rpc,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";

const RPC_URL = process.env.SOROBAN_RPC_URL ?? "https://soroban-testnet.stellar.org";
const PASSPHRASE = process.env.STELLAR_NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;
const SECRET = process.env.KEEPER_SECRET_KEY ?? "";
const MARKET = process.env.MARKET_ID ?? "";

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

async function readBool(
  server: rpc.Server,
  contractId: string,
  fn: string,
  ...args: xdr.ScVal[]
): Promise<boolean> {
  const acct = await server.getAccount(Keypair.random().publicKey()).catch(() => null);
  const source =
    acct?.accountId() ??
    "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
  let account;
  try {
    account = await server.getAccount(source);
  } catch {
    account = await server.getAccount(
      "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF",
    );
  }
  const tx = new TransactionBuilder(account, {
    fee: "100000",
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(call(contractId, fn, ...args))
    .setTimeout(30)
    .build();
  const sim = await server.simulateTransaction(tx);
  if (rpc.Api.isSimulationError(sim)) return false;
  const val = "result" in sim && sim.result?.retval ? sim.result.retval : undefined;
  return val ? Boolean(val.value()) : false;
}

export function loadMonthlyPayoutUsers(): string[] {
  const raw = process.env.MONTHLY_PAYOUT_USERS ?? "";
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function runMonthlyPayouts(
  server: rpc.Server,
  keeper: Keypair,
): Promise<void> {
  if (!MARKET) {
    log("payout", "market_not_configured");
    return;
  }

  const users = loadMonthlyPayoutUsers();
  if (users.length === 0) {
    log("payout", "no_users_configured", {
      hint: "Set MONTHLY_PAYOUT_USERS=G...,,G... in keeper .env",
    });
    return;
  }

  for (const user of users) {
    try {
      const due = await readBool(
        server,
        MARKET,
        "can_pay_monthly_yield",
        nativeToScVal(user, { type: "address" }),
      );
      if (!due) {
        log("payout", "not_due", { user });
        continue;
      }

      const acct = await server.getAccount(keeper.publicKey());
      let tx = new TransactionBuilder(acct, {
        fee: "500000",
        networkPassphrase: PASSPHRASE,
      })
        .addOperation(
          call(
            MARKET,
            "pay_monthly_yield_for",
            nativeToScVal(keeper.publicKey(), { type: "address" }),
            nativeToScVal(user, { type: "address" }),
          ),
        )
        .setTimeout(120)
        .build();
      tx = await server.prepareTransaction(tx);
      tx.sign(keeper);
      const result = await server.sendTransaction(tx);
      log("payout", "monthly_yield_sent", { user, hash: result.hash, status: result.status });
    } catch (e) {
      log("payout", "monthly_yield_error", { user, error: String(e) });
    }
  }
}
