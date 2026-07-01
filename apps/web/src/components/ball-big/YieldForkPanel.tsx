"use client";

import { Coins, Flame, Shield } from "lucide-react";
import { useTreasuryApp } from "@/contexts/TreasuryAppContext";
import { ChoiceCard, PrimaryButton } from "@/components/app/ui";
import { formatInrEquivalent } from "@/lib/ballBig";

export function YieldForkPanel() {
  const t = useTreasuryApp();
  const dustLabel =
    t.monthlyDue > 0n
      ? formatInrEquivalent(t.monthlyDue)
      : "₹5";
  const usdcLabel =
    t.monthlyDue > 0n
      ? `${t.formatAmount(t.monthlyDue.toString())} USDC`
      : "~0.06 USDC";

  return (
    <div>
      <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChoiceCard
          title="Claim safe"
          description={`Take your ${dustLabel} (${usdcLabel}) monthly dust straight to your wallet. Boring. Reliable. Yours.`}
          icon={<Shield className="h-5 w-5" />}
          variant="light"
          onClick={() => t.payMonthlyYield().catch(() => {})}
          disabled={!t.address || t.busy || !t.canPayMonthly}
          footer={
            t.canPayMonthly ? (
              <PrimaryButton
                size="md"
                className="w-full"
                disabled={!t.address || t.busy}
                onClick={(e) => {
                  e.stopPropagation();
                  t.payMonthlyYield().catch(() => {});
                }}
              >
                <Coins className="h-4 w-4" />
                Claim monthly yield
              </PrimaryButton>
            ) : (
              <p className="text-xs text-black/40">No dust due right now</p>
            )
          }
        />
        <ChoiceCard
          title="Ball big"
          description={`Skip the pennies. Route ${dustLabel} into Polymarket high-stakes and swing for 10x. Who's afraid?`}
          icon={<Flame className="h-5 w-5" />}
          variant="dark"
          comingSoon
          disabled
          footer={
            <PrimaryButton size="md" className="w-full" disabled>
              <Flame className="h-4 w-4" />
              Ball big on Polymarket
            </PrimaryButton>
          }
        />
      </div>
    </div>
  );
}
