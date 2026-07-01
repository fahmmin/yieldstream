import { Flame, Shield } from "lucide-react";
import { PillButton } from "./PillButton";
import { ComingSoonBadge } from "@/components/app/ui";

export function BallBigSection() {
  return (
    <section id="ball-big" className="bg-[#F5F5F5] px-6 py-24">
      <div className="mx-auto max-w-[88rem]">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm text-black/60">New · Coming Soon</p>
            <h2
              className="mb-6 text-4xl font-medium leading-tight text-black md:text-5xl"
              style={{ letterSpacing: "-0.03em" }}
            >
              Skip the pennies.
              <br />
              Ball big.
            </h2>
            <div className="mb-8 inline-flex items-center gap-4 rounded-2xl border border-black/10 bg-white px-6 py-4 shadow-sm">
              <span
                className="text-2xl font-medium text-black/50 md:text-3xl"
                style={{ letterSpacing: "-0.03em" }}
              >
                ₹5
              </span>
              <span className="text-lg font-medium text-[#2B2644]">→</span>
              <span
                className="text-2xl font-medium text-[#2B2644] md:text-3xl"
                style={{ letterSpacing: "-0.03em" }}
              >
                ₹50
              </span>
              <span className="text-xs font-medium uppercase tracking-wide text-black/40">
                illustrative
              </span>
            </div>
            <p className="mb-8 max-w-md text-base leading-relaxed text-black/70 md:text-lg">
              Monthly yield dust too small to care about? Claim it safe — or route it into
              Polymarket high-stakes. I&apos;d rather ball big than hoard spare change.
            </p>
            <PillButton label="See Ball Big" href="/treasury/ball-big" size="base" />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex min-h-48 flex-col justify-between rounded-2xl bg-[#2B2644] p-7 md:min-h-56 md:p-8">
              <Shield className="h-8 w-8 text-white/80" />
              <div>
                <h3
                  className="text-2xl font-medium text-white"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  Claim safe
                </h3>
                <p className="mt-2 text-base text-white/60">
                  Take your monthly dust straight to your wallet. Boring. Reliable. Works today.
                </p>
              </div>
            </div>

            <div className="relative flex min-h-48 flex-col justify-between rounded-2xl border border-black/5 bg-white p-7 shadow-sm md:min-h-56 md:p-8">
              <div className="absolute right-6 top-6">
                <ComingSoonBadge />
              </div>
              <Flame className="h-8 w-8 text-[#2B2644]" />
              <div>
                <h3
                  className="text-2xl font-medium text-black"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  Ball big on Polymarket
                </h3>
                <p className="mt-2 text-base text-black/60">
                  Send micro-yield into high-stakes prediction markets. Who needs pennies anyway?
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
