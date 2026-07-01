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
        eyebrow="Wallet"
        title="Fund & lock"
        description="Get testnet USDC, then deposit and lock from the dashboard for upfront monthly yield."
      />

      {!t.configured && (
        <AlertBanner>
          Contracts not configured — redeploy with Model A init and set env vars.
        </AlertBanner>
      )}

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
        <StatCard
          label="Your USDC"
          value={`${t.formatAmount(t.usdcBalance.toString())} USDC`}
          hint={t.usdcReady ? "Trustline active" : "Trustline required"}
        />
        <StatCard
          label="Locked principal"
          value={`${t.formatAmount(t.lockedPrincipal.toString())} USDC`}
          accent
        />
        <StatCard
          label="Yield received"
          value={`${t.formatAmount(t.totalYieldPaid.toString())} USDC`}
        />
        <StatCard label="Fixed rate" value="8% APY" hint="Testnet MVP" />
      </div>

      {t.error && <AlertBanner variant="error">{t.error}</AlertBanner>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Panel className="lg:col-span-3">
          <div className="mb-8 flex items-start gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black text-white">
              <ArrowDownToLine className="h-6 w-6" />
            </span>
            <div>
              <h2 className="text-2xl font-medium text-black" style={{ letterSpacing: "-0.03em" }}>
                Testnet USDC
              </h2>
              <p className="mt-2 max-w-lg text-base leading-relaxed text-black/60">
                Enable the USDC trustline and request faucet funds. Then use Deposit &amp; lock on
                the dashboard to lock principal and receive upfront yield.
              </p>
            </div>
          </div>

          <AmountInput
            label="Lock amount (use on dashboard)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <PrimaryButton
            className="mt-8 w-full"
            size="xl"
            disabled={!t.address || t.busy || !t.configured || t.matured}
            onClick={() => t.depositAndLock(amount).catch(() => {})}
          >
            <ArrowDownToLine className="h-6 w-6" />
            {t.busy ? "Processing…" : "Deposit & lock"}
          </PrimaryButton>

          {t.address && !t.usdcReady && (
            <button
              type="button"
              className="mt-3 w-full rounded-full border border-black/15 px-8 py-4 text-base font-medium text-black transition-colors hover:bg-black/5 disabled:opacity-40"
              disabled={t.busy}
              onClick={() => t.enableUsdc().catch(() => {})}
            >
              Enable testnet USDC (trustline)
            </button>
          )}

          {t.address && (
            <button
              type="button"
              className="mt-3 w-full rounded-full border border-black/15 px-8 py-4 text-base font-medium text-black transition-colors hover:bg-black/5 disabled:opacity-40"
              disabled={t.busy}
              onClick={() => t.requestTestUsdc().catch(() => {})}
            >
              Get test USDC (1000)
            </button>
          )}

          {!t.address && (
            <p className="mt-4 text-center text-sm text-black/50">
              Connect Freighter to continue.
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
                Model A flow
              </h2>
              <ul className="mt-6 space-y-4 text-base leading-relaxed text-white/60">
                <li>Deposit USDC → auto-lock as PT + YT.</li>
                <li>This month&apos;s yield paid upfront (90% user / 10% treasury).</li>
                <li>Principal hard-locked — no merge until maturity.</li>
                <li>Claim next month&apos;s yield when due; redeem PT at maturity.</li>
              </ul>
            </div>
            <div className="mt-8 rounded-xl bg-white/10 p-4">
              <p className="text-sm text-white/50">Wallet USDC</p>
              <p className="mt-1 text-3xl font-medium text-white" style={{ letterSpacing: "-0.03em" }}>
                {t.formatAmount(t.usdcBalance.toString())}
              </p>
            </div>
          </div>
        </Panel>
      </div>
    </>
  );
}
