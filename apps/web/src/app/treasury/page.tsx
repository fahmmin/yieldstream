"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowLeftRight,
  Coins,
  Gift,
  Merge,
  RefreshCw,
} from "lucide-react";
import { useTreasuryApp } from "@/contexts/TreasuryAppContext";
import {
  ActionTile,
  AlertBanner,
  AmountInput,
  PageHeader,
  Panel,
  PrimaryButton,
  StatCard,
} from "@/components/app/ui";

export default function TreasuryDashboardPage() {
  const t = useTreasuryApp();
  const [amount, setAmount] = useState("10");

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Dashboard"
        description="Your SY vault, PT/YT positions, and on-chain actions in one place."
      />

      {t.error && <AlertBanner variant="error">{t.error}</AlertBanner>}
      {!t.configured && (
        <AlertBanner>
          Contracts not configured. Deploy contracts and set <code className="font-mono">NEXT_PUBLIC_*</code> in{" "}
          <code className="font-mono">apps/web/.env.local</code>.{" "}
          <Link href="/treasury/settings" className="font-medium underline">
            View settings
          </Link>
        </AlertBanner>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Vault TVL"
          value={`${t.formatAmount(t.totalAssets.toString())} USDC`}
          hint="Total assets in SY vault"
        />
        <StatCard
          label="Your SY"
          value={t.formatAmount(t.syBalance.toString())}
          hint="Standardized yield shares"
          accent
        />
        <StatCard
          label="Claimable yield"
          value={`${t.formatAmount(t.claimable.toString())} USDC`}
          hint={t.matured ? "Market matured" : "From YT position"}
        />
        <StatCard
          label="Fixed APY"
          value="8%"
          hint={t.matured ? "Matured" : `Ledger ${t.maturity || "—"}`}
          accent
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-medium text-black" style={{ letterSpacing: "-0.03em" }}>
                Quick actions
              </h2>
              <p className="mt-1 text-sm text-black/60">Deposit, strip, claim, or merge in one flow.</p>
            </div>
            <button
              type="button"
              onClick={() => t.refresh()}
              disabled={t.busy}
              className="inline-flex items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black/70 transition-colors hover:bg-black/5 disabled:opacity-40"
            >
              <RefreshCw className={`h-4 w-4 ${t.busy ? "animate-spin" : ""}`} />
              Refresh
            </button>
          </div>

          <AmountInput
            label="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PrimaryButton
              className="w-full"
              size="lg"
              disabled={!t.address || t.busy}
              onClick={() => t.deposit(amount).catch(console.error)}
            >
              <ArrowDownToLine className="h-5 w-5" />
              Deposit USDC
            </PrimaryButton>
            <PrimaryButton
              className="w-full"
              size="lg"
              disabled={!t.address || t.busy || t.matured}
              onClick={() => t.strip(amount).catch(console.error)}
            >
              <ArrowLeftRight className="h-5 w-5" />
              Strip SY
            </PrimaryButton>
            <PrimaryButton
              className="w-full"
              size="lg"
              disabled={!t.address || t.busy || t.claimable === 0n}
              onClick={() => t.claimYield().catch(console.error)}
            >
              <Gift className="h-5 w-5" />
              Claim yield
            </PrimaryButton>
            <PrimaryButton
              className="w-full"
              size="lg"
              disabled={!t.address || t.busy || t.matured}
              onClick={() => t.merge(amount).catch(console.error)}
            >
              <Merge className="h-5 w-5" />
              Merge PT + YT
            </PrimaryButton>
          </div>
        </Panel>

        <Panel dark>
          <h2 className="text-xl font-medium text-white" style={{ letterSpacing: "-0.02em" }}>
            Your positions
          </h2>
          <dl className="mt-6 space-y-5">
            {[
              ["SY balance", t.formatAmount(t.syBalance.toString())],
              ["PT balance", t.formatAmount(t.ptBalance.toString())],
              ["YT balance", t.formatAmount(t.ytBalance.toString())],
              ["Status", t.matured ? "Matured" : "Active"],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 border-b border-white/10 pb-4 last:border-0 last:pb-0">
                <dt className="text-sm text-white/60">{label}</dt>
                <dd className="text-lg font-medium text-white">{value}</dd>
              </div>
            ))}
          </dl>
          <Link
            href="/treasury/market"
            className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-white py-3 text-base font-medium text-black transition-colors hover:bg-white/90"
          >
            Open market
          </Link>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <ActionTile
          title="Deposit to vault"
          description="Park USDC in the SY vault and earn fixed-rate standardized yield."
          icon={<Coins className="h-5 w-5" />}
          disabled={!t.address || t.busy}
          onClick={() => t.deposit(amount).catch(console.error)}
        />
        <ActionTile
          title="Strip into PT + YT"
          description="Split principal from yield rights for flexible treasury management."
          icon={<ArrowLeftRight className="h-5 w-5" />}
          variant="dark"
          disabled={!t.address || t.busy || t.matured}
          onClick={() => t.strip(amount).catch(console.error)}
        />
        <ActionTile
          title="Claim yield"
          description="Collect accrued yield from your YT position on schedule."
          icon={<Gift className="h-5 w-5" />}
          disabled={!t.address || t.busy || t.claimable === 0n}
          onClick={() => t.claimYield().catch(console.error)}
        />
      </div>
    </>
  );
}
