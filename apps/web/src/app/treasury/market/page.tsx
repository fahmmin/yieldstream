"use client";

import { useState } from "react";
import {
  ArrowLeftRight,
  Gift,
  Merge,
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

export default function MarketPage() {
  const t = useTreasuryApp();
  const [amount, setAmount] = useState("10");

  return (
    <>
      <PageHeader
        eyebrow="PT / YT Market"
        title="Market"
        description="Strip SY into principal and yield tokens, claim accrued yield, merge back, or redeem PT at maturity."
      />

      {t.matured && (
        <AlertBanner>
          Market has matured. You can redeem PT 1:1 for USDC. YT can no longer claim yield.
        </AlertBanner>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Your PT" value={t.formatAmount(t.ptBalance.toString())} />
        <StatCard label="Your YT" value={t.formatAmount(t.ytBalance.toString())} accent />
        <StatCard
          label="Claimable"
          value={`${t.formatAmount(t.claimable.toString())} USDC`}
        />
        <StatCard
          label="Maturity"
          value={t.matured ? "Reached" : "Active"}
          hint={`Ledger ${t.maturity || "—"}`}
          accent
        />
      </div>

      <Panel className="mb-8">
        <h2 className="mb-2 text-2xl font-medium text-black" style={{ letterSpacing: "-0.03em" }}>
          Transaction amount
        </h2>
        <p className="mb-6 text-sm text-black/60">
          Used for strip, merge, and redeem PT operations.
        </p>
        <AmountInput
          label="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </Panel>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <ActionTile
          title="Strip SY"
          description="Split SY into equal PT and YT — separate principal from yield rights."
          icon={<ArrowLeftRight className="h-5 w-5" />}
          disabled={!t.address || t.busy || t.matured}
          onClick={() => t.strip(amount).catch(console.error)}
        />
        <ActionTile
          title="Claim yield"
          description="Withdraw accrued yield from your YT position to your wallet."
          icon={<Gift className="h-5 w-5" />}
          variant="dark"
          disabled={!t.address || t.busy || t.claimable === 0n}
          onClick={() => t.claimYield().catch(console.error)}
        />
        <ActionTile
          title="Merge PT + YT"
          description="Recombine principal and yield tokens back into SY shares."
          icon={<Merge className="h-5 w-5" />}
          disabled={!t.address || t.busy || t.matured}
          onClick={() => t.merge(amount).catch(console.error)}
        />
        <ActionTile
          title="Redeem PT"
          description="After maturity, redeem PT 1:1 for underlying USDC from the vault."
          icon={<RotateCcw className="h-5 w-5" />}
          variant="dark"
          disabled={!t.address || t.busy || !t.matured}
          onClick={() => t.redeemPt(amount).catch(console.error)}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PrimaryButton
          className="w-full"
          size="xl"
          disabled={!t.address || t.busy || t.matured}
          onClick={() => t.strip(amount).catch(console.error)}
        >
          <ArrowLeftRight className="h-6 w-6" />
          Strip {amount} SY
        </PrimaryButton>
        <PrimaryButton
          className="w-full"
          size="xl"
          disabled={!t.address || t.busy || t.claimable === 0n}
          onClick={() => t.claimYield().catch(console.error)}
        >
          <Gift className="h-6 w-6" />
          Claim all yield
        </PrimaryButton>
      </div>
    </>
  );
}
