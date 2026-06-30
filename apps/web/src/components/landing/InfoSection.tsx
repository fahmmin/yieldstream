import { PillButton } from "./PillButton";

const CARD_IMAGE =
  "https://images.higgs.ai/?default=1&output=webp&url=https%3A%2F%2Fd8j0ntlcm91z4.cloudfront.net%2Fuser_38xzZboKViGWJOttwIXH07lWA1P%2Fhf_20260423_164207_f243351d-ed59-48ec-83a0-a5e996bdbe3c.png&w=1280&q=85";

export function InfoSection() {
  return (
    <section id="network" className="bg-[#F5F5F5] px-6 py-24">
      <div className="mx-auto max-w-[88rem]">
        <div className="mb-16 grid grid-cols-1 items-start gap-12 md:grid-cols-2">
          <div>
            <h2
              className="mb-8 text-4xl font-medium leading-tight text-black md:text-5xl"
              style={{ letterSpacing: "-0.03em" }}
            >
              Meet YieldStream.
            </h2>
            <PillButton label="Discover it" href="/treasury" size="base" />
          </div>
          <p className="text-2xl leading-relaxed text-black/70 md:text-3xl">
            A fixed-rate SY vault on Soroban that strips yield into tradeable PT and
            YT — your USDC stays productive while you choose how to deploy principal
            and yield.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div
            className="flex min-h-80 flex-col justify-between rounded-2xl lg:col-span-2"
            style={{
              backgroundImage: `url(${CARD_IMAGE})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
            <div className="flex min-h-80 flex-col justify-between p-7">
              <h3
                className="text-2xl font-medium leading-snug text-black"
                style={{ letterSpacing: "-0.02em" }}
              >
                Yield that strips
              </h3>
              <p className="max-w-xs text-base text-black/70">
                Deposit USDC into the SY vault and split principal from yield rights
                on demand — one deposit, two composable positions.
              </p>
            </div>
          </div>

          <div className="flex min-h-80 flex-col justify-between rounded-2xl bg-[#2B2644] p-7">
            <h3
              className="text-2xl font-medium text-white"
              style={{ letterSpacing: "-0.02em" }}
            >
              Always liquid,
              <br />
              always fixed.
            </h3>
            <p className="text-base text-white/60">
              Keep dollar-anchored exposure with on-demand strip, merge, and redeem
              — no opaque lockups or hidden waits.
            </p>
          </div>

          <div className="flex min-h-80 flex-col justify-between rounded-2xl bg-[#2B2644] p-7">
            <h3
              className="text-2xl font-medium text-white"
              style={{ letterSpacing: "-0.02em" }}
            >
              Fully
              <br />
              automated
            </h3>
            <p className="text-base text-white/60">
              Keeper services handle TTL extensions, maturity sweeps, and protocol
              hooks — YieldStream runs in the background for you.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
