"use client";

import { useState } from "react";
import { DevLogPanel } from "@/components/DevLogPanel";
import { useFreighter } from "@/hooks/useFreighter";
import { useTreasury } from "@/hooks/useTreasury";
import { NETWORK } from "@/lib/stellar";

function ActionButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
    >
      {label}
    </button>
  );
}

export default function TreasuryPage() {
  const { address, connect, loading, error, sign } = useFreighter();
  const t = useTreasury(address, sign);
  const [amount, setAmount] = useState("10");

  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">YieldStream Treasury</h1>
          <p className="text-sm text-muted">Soroban {NETWORK} — fixed-rate SY · PT/YT strip</p>
        </div>
        {address ? (
          <code className="rounded-lg bg-panel px-3 py-2 text-xs text-slate-300">
            {address.slice(0, 8)}…{address.slice(-6)}
          </code>
        ) : (
          <ActionButton label={loading ? "Connecting…" : "Connect Freighter"} onClick={connect} disabled={loading} />
        )}
      </header>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}
      {!t.configured && (
        <div className="mb-6 rounded-lg border border-amber-600/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-200">
          Contracts not configured. Deploy contracts and set <code>NEXT_PUBLIC_*</code> in{" "}
          <code>apps/web/.env.local</code>.
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <section className="rounded-xl border border-slate-700 bg-panel p-4">
          <h2 className="mb-3 text-sm font-medium text-muted">SY Vault</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>TVL</dt>
              <dd>{t.formatAmount(t.totalAssets.toString())} USDC</dd>
            </div>
            <div className="flex justify-between">
              <dt>Your SY</dt>
              <dd>{t.formatAmount(t.syBalance.toString())}</dd>
            </div>
            <div className="flex justify-between">
              <dt>APY</dt>
              <dd>8% fixed (testnet)</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-700 bg-panel p-4">
          <h2 className="mb-3 text-sm font-medium text-muted">PT / YT Market</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt>Maturity ledger</dt>
              <dd>{t.maturity || "—"}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Status</dt>
              <dd>{t.matured ? "Matured" : "Active"}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Your PT</dt>
              <dd>{t.formatAmount(t.ptBalance.toString())}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Your YT</dt>
              <dd>{t.formatAmount(t.ytBalance.toString())}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Claimable yield</dt>
              <dd>{t.formatAmount(t.claimable.toString())}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-700 bg-panel p-4">
          <h2 className="mb-3 text-sm font-medium text-muted">Actions</h2>
          <label className="mb-3 block text-xs text-muted">
            Amount (USDC)
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="mt-1 w-full rounded border border-slate-600 bg-surface px-3 py-2 text-sm text-white"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <ActionButton
              label="Deposit"
              disabled={!address || t.busy}
              onClick={() => t.deposit(amount).catch(console.error)}
            />
            <ActionButton
              label="Strip"
              disabled={!address || t.busy || t.matured}
              onClick={() => t.strip(amount).catch(console.error)}
            />
            <ActionButton
              label="Claim"
              disabled={!address || t.busy || t.claimable === 0n}
              onClick={() => t.claimYield().catch(console.error)}
            />
            <ActionButton
              label="Merge"
              disabled={!address || t.busy || t.matured}
              onClick={() => t.merge(amount).catch(console.error)}
            />
            <ActionButton
              label="Redeem PT"
              disabled={!address || t.busy || !t.matured}
              onClick={() => t.redeemPt(amount).catch(console.error)}
            />
          </div>
        </section>
      </div>

      <DevLogPanel />
    </main>
  );
}
