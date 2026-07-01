"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowDownToLine,
  Flame,
  Gift,
  Lock,
  RefreshCw,
  RotateCcw,
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
import { formatInrEquivalent, isDustYield } from "@/lib/ballBig";

export default function TreasuryDashboardPage() {
  const t = useTreasuryApp();
  const router = useRouter();
  const [amount, setAmount] = useState("100");

  useEffect(() => {
    void t.refreshPreview(amount);
  }, [amount, t.refreshPreview]);

  return (
    <>
      <PageHeader
        eyebrow="Savings"
        title="Dashboard"
        description="Deposit USDC, lock principal until maturity, and receive this month's yield upfront."
      />

      {t.error && <AlertBanner variant="error">{t.error}</AlertBanner>}
      {!t.configured && (
        <AlertBanner>
          Contracts not configured. Redeploy with Model A init and set{" "}
          <code className="font-mono">NEXT_PUBLIC_*</code> in{" "}
          <code className="font-mono">apps/web/.env.local</code>.{" "}
          <Link href="/treasury/settings" className="font-medium underline">
            View settings
          </Link>
        </AlertBanner>
      )}

      {isDustYield(t.monthlyDue) && t.canPayMonthly && (
        <Panel dark className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-white/60">Ball Big</p>
              <p
                className="mt-1 text-xl font-medium text-white md:text-2xl"
                style={{ letterSpacing: "-0.02em" }}
              >
                {formatInrEquivalent(t.monthlyDue)} sitting there. Claim it… or ball big?
              </p>
              <p className="mt-2 text-sm text-white/50">
                Who needs pennies anyway — swing for 10x on Polymarket instead.
              </p>
            </div>
            <Link
              href="/treasury/ball-big"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-base font-medium text-white transition-colors hover:bg-white/10"
            >
              <Flame className="h-4 w-4" />
              See Ball Big
            </Link>
          </div>
        </Panel>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Locked principal"
          value={`${t.formatAmount(t.lockedPrincipal.toString())} USDC`}
          hint="Hard-locked until maturity"
          accent
        />
        <StatCard
          label="Yield received"
          value={`${t.formatAmount(t.totalYieldPaid.toString())} USDC`}
          hint={`You keep ${t.userYieldSharePct}% of each payout`}
        />
        <StatCard
          label="Next monthly payout"
          value={
            t.canPayMonthly
              ? `${t.formatAmount(t.monthlyDue.toString())} USDC`
              : "Not due yet"
          }
          hint={t.matured ? "Market matured" : "Paid once per month"}
        />
        <StatCard
          label="Fixed APY"
          value="8%"
          hint={t.matured ? "Matured — redeem PT" : `Maturity ledger ${t.maturity || "—"}`}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2
                className="text-2xl font-medium text-black"
                style={{ letterSpacing: "-0.03em" }}
              >
                Deposit & lock
              </h2>
              <p className="mt-1 text-sm text-black/60">
                One step: deposit USDC, lock principal, receive this month&apos;s yield
                immediately ({t.userYieldSharePct}% to you).
              </p>
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

          <AmountInput label="Deposit amount (USDC)" value={amount} onChange={(e) => setAmount(e.target.value)} />

          <div className="mt-4 rounded-xl bg-black/[0.03] px-4 py-3 text-sm text-black/70">
            <p>
              <span className="font-medium text-black">Upfront yield preview:</span>{" "}
              {t.formatAmount(t.upfrontPreview.toString())} USDC to your wallet after lock
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-black/50">
              <Lock className="h-3.5 w-3.5" />
              Principal stays locked until maturity — no early withdrawal
            </p>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PrimaryButton
              className="w-full"
              size="lg"
              disabled={!t.address || t.busy || t.matured}
              onClick={() => t.depositAndLock(amount).catch(() => {})}
            >
              <ArrowDownToLine className="h-5 w-5" />
              Deposit & lock
            </PrimaryButton>
            <PrimaryButton
              className="w-full"
              size="lg"
              disabled={!t.address || t.busy || !t.canPayMonthly}
              onClick={() => t.payMonthlyYield().catch(() => {})}
            >
              <Gift className="h-5 w-5" />
              Claim monthly yield
            </PrimaryButton>
            {t.matured && (
              <PrimaryButton
                className="w-full sm:col-span-2"
                size="lg"
                disabled={!t.address || t.busy || t.ptBalance === 0n}
                onClick={() => {
                  const whole = t.ptBalance / 10_000_000n;
                  const frac = t.ptBalance % 10_000_000n;
                  const amt =
                    frac === 0n
                      ? whole.toString()
                      : `${whole}.${frac.toString().padStart(7, "0").replace(/0+$/, "")}`;
                  t.redeemPt(amt).catch(() => {});
                }}
              >
                <RotateCcw className="h-5 w-5" />
                Redeem locked principal
              </PrimaryButton>
            )}
          </div>
        </Panel>

        <Panel dark>
          <h2 className="text-xl font-medium text-white" style={{ letterSpacing: "-0.02em" }}>
            Your account
          </h2>
          <dl className="mt-6 space-y-5">
            {[
              ["Wallet USDC", t.formatAmount(t.usdcBalance.toString())],
              ["Locked PT", t.formatAmount(t.ptBalance.toString())],
              ["Yield rights (YT)", t.formatAmount(t.ytBalance.toString())],
              ["Unlocked SY", t.formatAmount(t.syBalance.toString())],
              ["Status", t.matured ? "Matured" : "Locked savings"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="flex items-center justify-between gap-4 border-b border-white/10 pb-4 last:border-0 last:pb-0"
              >
                <dt className="text-sm text-white/60">{label}</dt>
                <dd className="text-lg font-medium text-white">{value}</dd>
              </div>
            ))}
          </dl>
          <Link
            href="/treasury/vault"
            className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-white/20 py-3 text-base font-medium text-white transition-colors hover:bg-white/10"
          >
            Fund wallet (testnet)
          </Link>
        </Panel>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <ActionTile
          title="Deposit & lock"
          description="Lock USDC and receive this month's yield paid upfront from the vault."
          icon={<ArrowDownToLine className="h-5 w-5" />}
          disabled={!t.address || t.busy || t.matured}
          onClick={() => t.depositAndLock(amount).catch(() => {})}
        />
        <ActionTile
          title="Monthly yield"
          description="After each month, claim the next upfront yield payment when it becomes due."
          icon={<Gift className="h-5 w-5" />}
          variant="dark"
          disabled={!t.address || t.busy || !t.canPayMonthly}
          onClick={() => t.payMonthlyYield().catch(() => {})}
        />
        <ActionTile
          title="Ball big"
          description="Skip the pennies — route your dust yield into Polymarket high-stakes. Coming soon."
          icon={<Flame className="h-5 w-5" />}
          variant="dark"
          onClick={() => router.push("/treasury/ball-big")}
        />
        <ActionTile
          title="Hard-locked principal"
          description="PT and YT cannot be transferred or merged back until market maturity."
          icon={<Lock className="h-5 w-5" />}
          disabled
          onClick={() => {}}
        />
      </div>
    </>
  );
}
