import Link from "next/link";
import { ArrowRight } from "lucide-react";

const USE_CASE_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_183428_ab5e672a-f608-4dcb-b319-f3e040f02e2d.mp4";

export function UseCasesSection() {
  return (
    <section id="help" className="bg-[#F5F5F5] px-6 py-24">
      <div className="mx-auto grid max-w-[88rem] grid-cols-1 items-start gap-8 md:grid-cols-2">
        <div className="md:pr-12 md:pt-2">
          <p className="mb-2 text-sm text-black/60">YieldStream in Practice</p>
          <h2
            className="mb-6 text-5xl font-medium leading-none md:text-6xl"
            style={{ letterSpacing: "-0.04em" }}
          >
            Use modes
          </h2>
          <p className="max-w-sm text-base leading-relaxed text-black/60">
            YieldStream powers predictable yield stripping for treasuries, builders,
            and protocols that want safe USDC exposure with separable principal and
            yield rights on Stellar.
          </p>
        </div>

        <div className="relative min-h-[720px] overflow-hidden rounded-3xl">
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
      </div>
    </section>
  );
}
