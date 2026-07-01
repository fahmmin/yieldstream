import Link from "next/link";
import { ArrowRight, Flame } from "lucide-react";
import { ComingSoonBadge } from "@/components/app/ui";

const USE_CASE_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_183428_ab5e672a-f608-4dcb-b319-f3e040f02e2d.mp4";

export function UseCasesSection() {
  return (
    <section id="help" className="bg-[#F5F5F5] px-6 py-24">
      <div className="mx-auto max-w-[88rem]">
        <div className="mb-12 md:mb-16">
          <p className="mb-2 text-sm text-black/60">YieldStream in Practice</p>
          <h2
            className="mb-6 text-5xl font-medium leading-none md:text-6xl"
            style={{ letterSpacing: "-0.04em" }}
          >
            Use modes
          </h2>
          <p className="max-w-lg text-base leading-relaxed text-black/60">
            YieldStream powers predictable yield stripping for treasuries, builders,
            and protocols that want safe USDC exposure with separable principal and
            yield rights on Stellar.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="relative min-h-[480px] overflow-hidden rounded-3xl lg:min-h-[560px]">
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 h-full w-full object-cover"
            >
              <source src={USE_CASE_VIDEO} type="video/mp4" />
            </video>

            <div className="relative z-10 p-10 md:p-12">
              <h3
                className="mb-5 text-4xl font-medium leading-tight md:text-5xl"
                style={{ letterSpacing: "-0.03em" }}
              >
                Treasury
              </h3>
              <p className="mb-8 max-w-md text-base text-black/70">
                Park USDC in the SY vault, strip into PT and YT, and claim fixed-rate
                yield on schedule — ideal for treasuries that need transparent,
                on-chain cash management on Soroban testnet.
              </p>
              <Link
                href="/treasury"
                className="group inline-flex items-center gap-3 text-base font-medium text-black transition-colors duration-200"
              >
                Know more
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/80 backdrop-blur transition-colors duration-200 group-hover:bg-white">
                  <ArrowRight className="h-4 w-4 text-black" />
                </span>
              </Link>
            </div>
          </div>

          <div className="relative flex min-h-[480px] flex-col justify-between rounded-3xl bg-[#2B2644] p-10 md:min-h-[560px] md:p-12">
            <div className="flex items-start justify-between gap-4">
              <Flame className="h-10 w-10 text-white/80" />
              <ComingSoonBadge />
            </div>
            <div>
              <h3
                className="mb-5 text-4xl font-medium leading-tight text-white md:text-5xl"
                style={{ letterSpacing: "-0.03em" }}
              >
                Ball Big mode
              </h3>
              <p className="mb-8 max-w-md text-base text-white/60">
                Monthly yield dust too small to matter? Skip the claim — route micro-yield
                into Polymarket high-stakes. ₹5 into ₹50? Who needs pennies anyway.
              </p>
              <Link
                href="/treasury/ball-big"
                className="group inline-flex items-center gap-3 text-base font-medium text-white transition-colors duration-200"
              >
                See Ball Big
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 transition-colors duration-200 group-hover:bg-white/20">
                  <ArrowRight className="h-4 w-4 text-white" />
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
