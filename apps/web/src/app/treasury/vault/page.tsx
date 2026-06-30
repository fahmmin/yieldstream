"use client";

import { useState } from "react";
import { ArrowDownToLine, TrendingUp } from "lucide-react";
import { useTreasuryApp } from "@/contexts/TreasuryAppContext";
import {
  AlertBanner,
  AmountInput,
  PageHeader,
  Panel,
  PrimaryButton,
  StatCard,
} from "@/components/app/ui";

export default function VaultPage() {
  const t = useTreasuryApp();
  const [amount, setAmount] = useState("100");

  return (
    <>
      <PageHeader
        eyebrow="SY Vault"
        title="Vault"
        description="Deposit USDC into the standardized yield vault. Shares represent your claim on vault assets and fixed-rate yield."
      />

      {!t.configured && (
        <AlertBanner>
          Contracts not configured — set env vars before depositing.
        </AlertBanner>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <StatCard
          label="Total vault assets"
          value={`${t.formatAmount(t.totalAssets.toString())} USDC`}
        />
        <StatCard label="Your SY shares" value={t.formatAmount(t.syBalance.toString())} accent />
        <StatCard label="Fixed rate" value="8% APY" hint="Testnet MVP" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Panel className="lg:col-span-3">
          <div className="mb-8 flex items-start gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white">
              <ArrowDownToLine className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-2xl font-medium text-black" style={{ letterSpacing: "-0.03em" }}>
                Deposit USDC
              </h2>
              <p className="mt-2 max-w-lg text-base leading-relaxed text-black/60">
                Mint SY shares 1:1 against deposited USDC. Your position compounds at the vault fixed rate until you strip or redeem.
              </p>
            </div>
          </div>

          <AmountInput
            label="Deposit amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <PrimaryButton
            className="mt-8 w-full"
            size="xl"
            disabled={!t.address || t.busy || !t.configured}
            onClick={() => t.deposit(amount).catch(console.error)}
          >
            <ArrowDownToLine className="h-6 w-6" />
            {t.busy ? "Processing…" : "Deposit to vault"}
          </PrimaryButton>

          {!t.address && (
            <p className="mt-4 text-center text-sm text-black/50">
              Connect Freighter to deposit.
            </p>
          )}
        </Panel>

        <Panel dark className="lg:col-span-2">
          <div className="flex h-full flex-col justify-between">
            <div>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                <TrendingUp className="h-5 w-5" />
              </span>
              <h2 className="mt-6 text-2xl font-medium text-white" style={{ letterSpacing: "-0.02em" }}>
                How the vault works
              </h2>
              <ul className="mt-6 space-y-4 text-base leading-relaxed text-white/60">
                <li>Deposit USDC → receive SY shares backed by vault assets.</li>
                <li>Fixed 8% APY accrues to the vault on testnet.</li>
                <li>Strip SY anytime into PT (principal) + YT (yield rights).</li>
                <li>Merge PT + YT back into SY before maturity.</li>
              </ul>
            </div>
            <div className="mt-8 rounded-xl bg-white/10 p-4">
              <p className="text-sm text-white/50">Your balance</p>
              <p className="mt-1 text-3xl font-medium text-white" style={{ letterSpacing: "-0.03em" }}>
                {t.formatAmount(t.syBalance.toString())} SY
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
