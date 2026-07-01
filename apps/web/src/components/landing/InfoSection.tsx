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
            <PillButton label="Start saving" href="/treasury" size="base" />
          </div>
          <p className="text-2xl leading-relaxed text-black/70 md:text-3xl">
            Lock your USDC, keep your principal safe, and get this month&apos;s yield paid
            upfront — 90% to you, 10% to the protocol treasury.
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
                Yield paid early
              </h3>
              <p className="max-w-xs text-base text-black/70">
                Deposit and lock — your first month&apos;s yield lands in your wallet
                immediately, before the month even accrues on-chain.
              </p>
            </div>
          </div>

          <div className="flex min-h-80 flex-col justify-between rounded-2xl bg-[#2B2644] p-7">
            <h3
              className="text-2xl font-medium text-white"
              style={{ letterSpacing: "-0.02em" }}
            >
              Principal
              <br />
              hard-locked
            </h3>
            <p className="text-base text-white/60">
              Your deposit stays locked until maturity. No merge, no early exit —
              only yield is paid out monthly.
            </p>
          </div>

          <div className="flex min-h-80 flex-col justify-between rounded-2xl bg-[#2B2644] p-7">
            <h3
              className="text-2xl font-medium text-white"
              style={{ letterSpacing: "-0.02em" }}
            >
              Keeper
              <br />
              automated
            </h3>
            <p className="text-base text-white/60">
              Monthly payout keeper batches yield for registered users. TTL and
              maturity sweeps run in the background.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
