"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Contract,
  nativeToScVal,
  TransactionBuilder,
  xdr,
} from "@stellar/stellar-sdk";
import { devLog, newFlowId } from "@/lib/devLog";
import {
  CONTRACTS,
  formatAmount,
  getHorizon,
  getServer,
  isConfigured,
  PASSPHRASE,
  readContractBool,
  readContractI128,
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

export function useTreasury(address: string | null, sign: (xdr: string) => Promise<string>) {
  const [syBalance, setSyBalance] = useState<bigint>(0n);
  const [ptBalance, setPtBalance] = useState<bigint>(0n);
  const [ytBalance, setYtBalance] = useState<bigint>(0n);
  const [claimable, setClaimable] = useState<bigint>(0n);
  const [totalAssets, setTotalAssets] = useState<bigint>(0n);
  const [maturity, setMaturity] = useState<number>(0);
  const [matured, setMatured] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!address || !isConfigured()) return;
    try {
      const [sy, pt, yt, claim, tvl, mat, isMat] = await Promise.all([
        readContractI128(CONTRACTS.syVault, "balance", address, address),
        readContractI128(CONTRACTS.ptToken, "balance", address, address),
        readContractI128(CONTRACTS.ytToken, "balance", address, address),
        readContractI128(CONTRACTS.market, "claimable_yield", address, address),
        readContractI128(CONTRACTS.syVault, "total_assets", undefined, address),
        readContractI128(CONTRACTS.market, "maturity_ledger", undefined, address),
        readContractBool(CONTRACTS.market, "is_matured", address),
      ]);
      setSyBalance(sy);
      setPtBalance(pt);
      setYtBalance(yt);
      setClaimable(claim);
      setTotalAssets(tvl);
      setMaturity(Number(mat));
      setMatured(isMat);
    } catch (e) {
      devLog("vault", "refresh_error", {
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }, [address]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
  }, [refresh]);

  const invoke = useCallback(
    async (scope: "vault" | "market", label: string, buildOps: (addr: string) => xdr.Operation) => {
      if (!address) throw new Error("Wallet not connected");
      if (!isConfigured()) throw new Error("Contracts not configured — set .env.local");
      const flowId = newFlowId();
      setBusy(true);
      try {
        const horizon = getHorizon();
        const server = getServer();
        const account = await horizon.loadAccount(address);
        let tx = new TransactionBuilder(account, {
          fee: "500000",
          networkPassphrase: PASSPHRASE,
        })
          .addOperation(buildOps(address))
          .setTimeout(180)
          .build();
        tx = await server.prepareTransaction(tx);
        const signed = await sign(tx.toXDR());
        const sent = await server.sendTransaction(
          TransactionBuilder.fromXDR(signed, PASSPHRASE),
        );
        devLog(scope, label, { hash: sent.hash, status: sent.status }, flowId);
        await refresh();
        return sent;
      } finally {
        setBusy(false);
      }
    },
    [address, sign, refresh],
  );

  const deposit = useCallback(
    (amount: string) =>
      invoke("vault", "deposit", (from) =>
        call(
          CONTRACTS.syVault,
          "deposit",
          nativeToScVal(from, { type: "address" }),
          nativeToScVal(toI128(amount), { type: "i128" }),
        ),
      ),
    [invoke],
  );

  const strip = useCallback(
    (amount: string) =>
      invoke("market", "strip", (user) =>
        call(
          CONTRACTS.market,
          "strip",
          nativeToScVal(user, { type: "address" }),
          nativeToScVal(toI128(amount), { type: "i128" }),
        ),
      ),
    [invoke],
  );

  const merge = useCallback(
    (amount: string) =>
      invoke("market", "merge", (user) =>
        call(
          CONTRACTS.market,
          "merge",
          nativeToScVal(user, { type: "address" }),
          nativeToScVal(toI128(amount), { type: "i128" }),
        ),
      ),
    [invoke],
  );

  const claimYield = useCallback(
    () =>
      invoke("market", "claim_yield", (user) =>
        call(CONTRACTS.market, "claim_yield", nativeToScVal(user, { type: "address" })),
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

  return {
    syBalance,
    ptBalance,
    ytBalance,
    claimable,
    totalAssets,
    maturity,
    matured,
    busy,
    configured: isConfigured(),
    deposit,
    strip,
    merge,
    claimYield,
    redeemPt,
    refresh,
    formatAmount,
  };
}
