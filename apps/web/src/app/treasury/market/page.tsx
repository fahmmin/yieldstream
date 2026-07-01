"use client";

import { useState } from "react";
import { ArrowDownToLine, Gift, Lock, RotateCcw } from "lucide-react";
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

export default function MarketPage() {
  const t = useTreasuryApp();
  const [amount, setAmount] = useState("100");

  return (
    <>
      <PageHeader
        eyebrow="Locked savings"
        title="Your lock"
        description="Model A: monthly yield paid upfront. Principal is hard-locked until maturity."
      />

      <AlertBanner>
        Early withdrawal is disabled. Your deposit is locked as PT until the maturity ledger.
        Merge is not available.
      </AlertBanner>

      {t.matured && (
        <AlertBanner>
          Market has matured. Redeem PT 1:1 for USDC. Monthly yield payments have ended.
        </AlertBanner>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Locked PT" value={t.formatAmount(t.ptBalance.toString())} accent />
        <StatCard label="YT (yield rights)" value={t.formatAmount(t.ytBalance.toString())} />
        <StatCard
          label="Total yield received"
          value={`${t.formatAmount(t.totalYieldPaid.toString())} USDC`}
        />
        <StatCard
          label="Next payout"
          value={t.canPayMonthly ? "Due now" : "Not due"}
          hint={`Fee: ${t.feeBps / 100}% to treasury`}
        />
      </div>

      <Panel className="mb-8">
        <h2 className="mb-2 text-2xl font-medium text-black" style={{ letterSpacing: "-0.03em" }}>
          Add to your lock
        </h2>
        <p className="mb-6 text-sm text-black/60">
          Each deposit locks principal and pays this month&apos;s yield on the new amount immediately.
        </p>
        <AmountInput label="USDC amount" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </Panel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ActionTile
          title="Deposit & lock more"
          description="Deposit USDC, auto-strip, and receive upfront monthly yield on the new deposit."
          icon={<ArrowDownToLine className="h-5 w-5" />}
          disabled={!t.address || t.busy || t.matured}
          onClick={() => t.depositAndLock(amount).catch(() => {})}
        />
        <ActionTile
          title="Claim monthly yield"
          description="Collect the next month's upfront yield when the 30-day period has passed."
          icon={<Gift className="h-5 w-5" />}
          variant="dark"
          disabled={!t.address || t.busy || !t.canPayMonthly}
          onClick={() => t.payMonthlyYield().catch(() => {})}
        />
        <ActionTile
          title="Principal locked"
          description="PT/YT transfers are disabled. Merge is permanently blocked (Model A)."
          icon={<Lock className="h-5 w-5" />}
          disabled
        />
        <ActionTile
          title="Redeem at maturity"
          description="After maturity, burn PT+YT and receive your principal back as SY/USDC."
          icon={<RotateCcw className="h-5 w-5" />}
          variant="dark"
          disabled={!t.address || t.busy || !t.matured}
          onClick={() => t.redeemPt(amount).catch(() => {})}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PrimaryButton
          className="w-full"
          size="xl"
          disabled={!t.address || t.busy || t.matured}
          onClick={() => t.depositAndLock(amount).catch(() => {})}
        >
          <ArrowDownToLine className="h-6 w-6" />
          Lock {amount} USDC
        </PrimaryButton>
        <PrimaryButton
          className="w-full"
          size="xl"
          disabled={!t.address || t.busy || !t.canPayMonthly}
          onClick={() => t.payMonthlyYield().catch(() => {})}
        >
          <Gift className="h-6 w-6" />
          Claim monthly yield
        </PrimaryButton>
      </div>
    </>
  );
}
