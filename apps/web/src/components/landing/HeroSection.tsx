import { PillButton } from "./PillButton";
import { BrandMarquee } from "./BrandMarquee";

const HERO_VIDEO =
  "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260423_161253_c72b1869-400f-45ed-ac0c-52f68c2ed5bd.mp4";

export function HeroSection() {
  return (
    <section className="flex flex-1 items-end px-6 pb-6 pt-20">
      <div
        className="relative w-full overflow-hidden rounded-2xl"
        style={{ height: "calc(100vh - 96px)" }}
      >
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        >
          <source src={HERO_VIDEO} type="video/mp4" />
        </video>

        <div className="relative z-10 flex h-full flex-col items-start justify-start p-12 pt-36">
          <h1
            className="mb-4 max-w-xl text-5xl font-medium leading-tight text-black md:text-6xl"
            style={{ letterSpacing: "-0.04em" }}
          >
            Your Yield
            <br />
            Flows
          </h1>
          <p
            className="mb-8 max-w-md text-base leading-relaxed text-black/70 md:text-lg"
            style={{
              fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
            }}
          >
            Automated yield stripping on Stellar Soroban — deposit USDC, split into
            principal and yield tokens, and let fixed-rate earnings work in the
            background.
          </p>
          <PillButton label="Launch app" href="/treasury" />
          <BrandMarquee />
        </div>
      </div>
    </section>
  );
}
