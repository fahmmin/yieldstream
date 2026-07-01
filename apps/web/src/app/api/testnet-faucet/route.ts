import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { NextResponse } from "next/server";
import {
  Contract,
  Horizon,
  Keypair,
  nativeToScVal,
  Networks,
  rpc,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

const execFileAsync = promisify(execFile);

const NETWORK = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? "testnet";
const RPC_URL =
  process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ??
  "https://soroban-testnet.stellar.org";
const HORIZON_URL =
  process.env.NEXT_PUBLIC_HORIZON_URL ??
  "https://horizon-testnet.stellar.org";
const PASSPHRASE =
  NETWORK === "mainnet" ? Networks.PUBLIC : Networks.TESTNET;
const USDC_ID = process.env.NEXT_PUBLIC_USDC_ID ?? "";
const FAUCET_AMOUNT = 10_000_000_000n; // 1000 USDC (7 decimals)
const ISSUER_IDENTITY =
  process.env.STELLAR_USDC_ISSUER_IDENTITY ?? "yieldstream-usdc-issuer";

function isGAddress(addr: string) {
  return /^G[A-Z2-7]{55}$/.test(addr);
}

async function mintViaCli(to: string): Promise<string> {
  const { stdout } = await execFileAsync(
    "stellar",
    [
      "contract",
      "invoke",
      "--id",
      USDC_ID,
      "--network",
      NETWORK,
      "--source",
      ISSUER_IDENTITY,
      "--",
      "mint",
      "--to",
      to,
      "--amount",
      FAUCET_AMOUNT.toString(),
    ],
    { timeout: 90_000 },
  );
  const match = stdout.match(/[a-f0-9]{64}/);
  return match?.[0] ?? "submitted";
}

async function mintViaSdk(to: string): Promise<string> {
  const secret = process.env.STELLAR_USDC_ISSUER_SECRET;
  if (!secret) {
    throw new Error(
      "Faucet unavailable: set STELLAR_USDC_ISSUER_SECRET or install Stellar CLI with yieldstream-usdc-issuer identity",
    );
  }

  const issuer = Keypair.fromSecret(secret);
  const horizon = new Horizon.Server(HORIZON_URL);
  const server = new rpc.Server(RPC_URL);
  const account = await horizon.loadAccount(issuer.publicKey());

  let tx = new TransactionBuilder(account, {
    fee: "500000",
    networkPassphrase: PASSPHRASE,
  })
    .addOperation(
      new Contract(USDC_ID).call(
        "mint",
        nativeToScVal(to, { type: "address" }),
        nativeToScVal(FAUCET_AMOUNT, { type: "i128" }),
      ),
    )
    .setTimeout(180)
    .build();

  tx = await server.prepareTransaction(tx);
  tx.sign(issuer);
  const sent = await server.sendTransaction(tx);
  if (sent.status === "ERROR") {
    throw new Error("Mint transaction rejected");
  }
  return sent.hash ?? "submitted";
}

export async function POST(req: Request) {
  if (NETWORK !== "testnet") {
    return NextResponse.json({ error: "Faucet only available on testnet" }, { status: 403 });
  }
  if (!USDC_ID) {
    return NextResponse.json({ error: "USDC contract not configured" }, { status: 500 });
  }

  let address: string;
  try {
    const body = (await req.json()) as { address?: string };
    address = body.address ?? "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isGAddress(address)) {
    return NextResponse.json({ error: "Invalid Stellar address" }, { status: 400 });
  }

  try {
    let hash: string;
    try {
      hash = await mintViaCli(address);
    } catch {
      hash = await mintViaSdk(address);
    }
    return NextResponse.json({
      ok: true,
      hash,
      amount: FAUCET_AMOUNT.toString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("trustline entry is missing")) {
      return NextResponse.json(
        { error: "Enable USDC trustline in your wallet first, then retry." },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
