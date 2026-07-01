"use client";

import { useTreasuryApp } from "@/contexts/TreasuryAppContext";
import { BallBigDisclaimer } from "@/components/ball-big/BallBigDisclaimer";
import { BallBigHero } from "@/components/ball-big/BallBigHero";
import { StakesMarketGrid } from "@/components/ball-big/StakesMarketGrid";
import { YieldForkPanel } from "@/components/ball-big/YieldForkPanel";
import { AlertBanner, StatCard } from "@/components/app/ui";
import { formatInrEquivalent, formatInrTenX } from "@/lib/ballBig";

export default function BallBigPage() {
  const t = useTreasuryApp();

  const dustAvailable =
    t.monthlyDue > 0n
      ? `${t.formatAmount(t.monthlyDue.toString())} USDC`
      : "—";
  const inrDust =
    t.monthlyDue > 0n ? formatInrEquivalent(t.monthlyDue) : "—";
  const inrTarget =
    t.monthlyDue > 0n ? formatInrTenX(t.monthlyDue) : "—";

  return (
    <>
      <BallBigHero />

      {t.error && <AlertBanner variant="error">{t.error}</AlertBanner>}

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Dust yield available"
          value={dustAvailable}
          hint={inrDust !== "—" ? `${inrDust} equivalent` : "Claim when due"}
          accent
        />
        <StatCard
          label="10x target (illustrative)"
          value={inrTarget}
          hint="Not guaranteed — for vibes only"
        />
        <StatCard
          label="Yield received (lifetime)"
          value={`${t.formatAmount(t.totalYieldPaid.toString())} USDC`}
          hint="Pennies you've already claimed"
        />
      </div>

      <div className="mb-8">
        <YieldForkPanel />
      </div>

      <div className="mb-8">
        <StakesMarketGrid />
      </div>

      <BallBigDisclaimer />
    </>
  );
}
