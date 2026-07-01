"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Contract,
  nativeToScVal,
  rpc,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import { devLog, newFlowId } from "@/lib/devLog";
import {
  buildUsdcTrustOp,
  CONTRACTS,
  formatAmount,
  getHorizon,
  getServer,
  hasUsdcTrustline,
  isConfigured,
  parseContractError,
  PASSPHRASE,
  readContractBool,
  readContractI128,
  readContractI128Args,
  readUsdcBalance,
} from "@/lib/stellar";

function toI128(amount: string): bigint {
  const parts = amount.split(".");
  const whole = BigInt(parts[0] || "0");
  const frac = (parts[1] ?? "").padEnd(7, "0").slice(0, 7);
  return whole * 10_000_000n + BigInt(frac || "0");
}

function call(contractId: string, fn: string, ...args: xdr.ScVal[]) {
  return new Contract(contractId).call(fn, ...args);
}

async function waitForTx(hash: string) {
  const server = getServer();
  for (let i = 0; i < 60; i++) {
    const tx = await server.getTransaction(hash);
    if (tx.status === rpc.Api.GetTransactionStatus.SUCCESS) return tx;
    if (tx.status === rpc.Api.GetTransactionStatus.FAILED) {
      throw new Error(tx.resultXdr ?? "Transaction failed on ledger");
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("Transaction confirmation timed out");
}

export function useTreasury(address: string | null, sign: (xdr: string) => Promise<string>) {
  const [syBalance, setSyBalance] = useState<bigint>(0n);
  const [ptBalance, setPtBalance] = useState<bigint>(0n);
  const [ytBalance, setYtBalance] = useState<bigint>(0n);
  const [usdcBalance, setUsdcBalance] = useState<bigint>(0n);
  const [usdcReady, setUsdcReady] = useState(false);
  const [lockedPrincipal, setLockedPrincipal] = useState<bigint>(0n);
  const [totalYieldPaid, setTotalYieldPaid] = useState<bigint>(0n);
  const [monthlyDue, setMonthlyDue] = useState<bigint>(0n);
  const [canPayMonthly, setCanPayMonthly] = useState(false);
  const [upfrontPreview, setUpfrontPreview] = useState<bigint>(0n);
  const [feeBps, setFeeBps] = useState<number>(1000);
  const [totalAssets, setTotalAssets] = useState<bigint>(0n);
  const [maturity, setMaturity] = useState<number>(0);
  const [matured, setMatured] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!address || !isConfigured()) return;
    try {
      const [
        sy,
        pt,
        yt,
        locked,
        paid,
        due,
        canPay,
        tvl,
        mat,
        isMat,
        usdc,
        trusted,
        fee,
      ] = await Promise.all([
        readContractI128(CONTRACTS.syVault, "balance", address, address),
        readContractI128(CONTRACTS.ptToken, "balance", address, address),
        readContractI128(CONTRACTS.ytToken, "balance", address, address),
        readContractI128(CONTRACTS.market, "locked_principal", address, address),
        readContractI128(CONTRACTS.market, "total_yield_paid", address, address),
        readContractI128(CONTRACTS.market, "claimable_yield", address, address),
        readContractBool(CONTRACTS.market, "can_pay_monthly_yield", address, address),
        readContractI128(CONTRACTS.syVault, "total_assets", undefined, address),
        readContractI128(CONTRACTS.market, "maturity_ledger", undefined, address),
        readContractBool(CONTRACTS.market, "is_matured", address),
        readUsdcBalance(address),
        hasUsdcTrustline(address),
        readContractI128(CONTRACTS.market, "fee_bps", undefined, address),
      ]);
      setSyBalance(sy);
      setPtBalance(pt);
      setYtBalance(yt);
      setLockedPrincipal(locked);
      setTotalYieldPaid(paid);
      setMonthlyDue(due);
      setCanPayMonthly(canPay);
      setTotalAssets(tvl);
      setMaturity(Number(mat));
      setMatured(isMat);
      setUsdcBalance(usdc);
      setUsdcReady(trusted);
      setFeeBps(Number(fee) || 1000);
    } catch (e) {
      devLog("vault", "refresh_error", {
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }, [address]);

  const refreshPreview = useCallback(
    async (amount: string) => {
      if (!isConfigured()) return;
      try {
        const preview = await readContractI128Args(
          CONTRACTS.market,
          "preview_upfront_yield",
          [nativeToScVal(toI128(amount), { type: "i128" })],
          address ?? undefined,
        );
        setUpfrontPreview(preview);
      } catch {
        setUpfrontPreview(0n);
      }
    },
    [address],
  );

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
  }, [refresh]);

  const submitTx = useCallback(
    async (scope: "vault" | "market" | "usdc", label: string, ops: xdr.Operation[]) => {
      if (!address) throw new Error("Wallet not connected");
      if (!isConfigured()) throw new Error("Contracts not configured — set .env.local");
      const flowId = newFlowId();
      setBusy(true);
      setError(null);
      try {
        const horizon = getHorizon();
        const server = getServer();
        const account = await horizon.loadAccount(address);
        let builder = new TransactionBuilder(account, {
          fee: String(500_000 * ops.length),
          networkPassphrase: PASSPHRASE,
        });
        for (const op of ops) {
          builder = builder.addOperation(op);
        }
        let tx = builder.setTimeout(180).build();
        tx = await server.prepareTransaction(tx);
        const signed = await sign(tx.toXDR());
        const sent = await server.sendTransaction(
          TransactionBuilder.fromXDR(signed, PASSPHRASE),
        );
        if (sent.status === "ERROR") {
          throw new Error(sent.errorResult?.toXDR("base64") ?? "Transaction rejected");
        }
        if (sent.hash) {
          await waitForTx(sent.hash);
        }
        devLog(scope, label, { hash: sent.hash, status: sent.status }, flowId);
        await refresh();
        return sent;
      } catch (e) {
        const msg = parseContractError(e);
        setError(msg);
        throw new Error(msg);
      } finally {
        setBusy(false);
      }
    },
    [address, sign, refresh],
  );

  const invoke = useCallback(
    async (scope: "vault" | "market", label: string, buildOps: (addr: string) => xdr.Operation) => {
      return submitTx(scope, label, [buildOps(address!)]);
    },
    [address, submitTx],
  );

  const enableUsdc = useCallback(async () => {
    if (!address) throw new Error("Wallet not connected");
    if (!CONTRACTS.usdc) throw new Error("USDC contract not configured");
    await submitTx("usdc", "trust", [buildUsdcTrustOp(address)]);
    setUsdcReady(true);
  }, [address, submitTx]);

  const requestTestUsdc = useCallback(async () => {
    if (!address) throw new Error("Wallet not connected");
    setBusy(true);
    setError(null);
    try {
      if (!usdcReady) {
        await enableUsdc();
      }
      const res = await fetch("/api/testnet-faucet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = (await res.json()) as { error?: string; amount?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Faucet request failed");
      }
      devLog("usdc", "faucet", { address, amount: data.amount });
      await refresh();
    } catch (e) {
      const msg = parseContractError(e);
      setError(msg);
      throw new Error(msg);
    } finally {
      setBusy(false);
    }
  }, [address, enableUsdc, refresh, usdcReady]);

  const ensureUsdcReady = useCallback(async () => {
    if (!address) return;
    const trusted = await hasUsdcTrustline(address);
    if (!trusted) {
      await enableUsdc();
    }
  }, [address, enableUsdc]);

  const depositAndLock = useCallback(
    async (amount: string) => {
      await ensureUsdcReady();
      const needed = toI128(amount);
      const balance = await readUsdcBalance(address!);
      if (balance < needed) {
        throw new Error(
          `Insufficient USDC (have ${formatAmount(balance.toString())}, need ${amount}). Use "Get test USDC" first.`,
        );
      }
      return invoke("market", "deposit_and_lock", (user) =>
        call(
          CONTRACTS.market,
          "deposit_and_lock",
          nativeToScVal(user, { type: "address" }),
          nativeToScVal(needed, { type: "i128" }),
        ),
      );
    },
    [address, ensureUsdcReady, invoke],
  );

  const payMonthlyYield = useCallback(
    () =>
      invoke("market", "pay_monthly_yield", (user) =>
        call(CONTRACTS.market, "pay_monthly_yield", nativeToScVal(user, { type: "address" })),
      ),
    [invoke],
  );

  const redeemPt = useCallback(
    (amount: string) =>
      invoke("market", "redeem_pt", (user) =>
        call(
          CONTRACTS.market,
          "redeem_pt",
          nativeToScVal(user, { type: "address" }),
          nativeToScVal(toI128(amount), { type: "i128" }),
        ),
      ),
    [invoke],
  );

  const userYieldSharePct = 100 - feeBps / 100;

  return {
    syBalance,
    ptBalance,
    ytBalance,
    usdcBalance,
    usdcReady,
    lockedPrincipal,
    totalYieldPaid,
    monthlyDue,
    canPayMonthly,
    upfrontPreview,
    feeBps,
    userYieldSharePct,
    totalAssets,
    maturity,
    matured,
    busy,
    error,
    configured: isConfigured(),
    depositAndLock,
    payMonthlyYield,
    redeemPt,
    enableUsdc,
    requestTestUsdc,
    refresh,
    refreshPreview,
    formatAmount,
  };
}
