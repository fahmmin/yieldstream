import { MOCK_HIGH_STAKES_MARKETS } from "@/lib/ballBig";
import { ComingSoonBadge, Panel } from "@/components/app/ui";

export function StakesMarketGrid() {
  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            className="text-2xl font-medium text-black"
            style={{ letterSpacing: "-0.03em" }}
          >
            High-stakes markets
          </h2>
          <p className="mt-1 text-sm text-black/60">
            Curated Polymarket picks for your dust. Preview only — trading coming soon.
          </p>
        </div>
        <ComingSoonBadge />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {MOCK_HIGH_STAKES_MARKETS.map((market) => (
          <Panel key={market.id} className="relative overflow-hidden opacity-75">
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-white/40 backdrop-blur-[1px]" />
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-black/40">
              Resolves in {market.resolvesIn}
            </p>
            <h3
              className="mb-4 text-lg font-medium leading-snug text-black"
              style={{ letterSpacing: "-0.02em" }}
            >
              {market.question}
            </h3>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-black/60">Yes</span>
              <span className="font-medium text-black">
                {(market.yesPrice * 100).toFixed(0)}¢
              </span>
            </div>
            <div className="mb-4 h-2 overflow-hidden rounded-full bg-black/5">
              <div
                className="h-full rounded-full bg-[#2B2644]"
                style={{ width: `${market.yesPrice * 100}%` }}
              />
            </div>
            <p className="text-xs text-black/40">Vol {market.volume}</p>
          </Panel>
        ))}
      </div>
    </div>
  );
}
