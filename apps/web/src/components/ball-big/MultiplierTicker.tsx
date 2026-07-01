"use client";

import { formatInrEquivalent, formatInrTenX } from "@/lib/ballBig";

export function MultiplierTicker({ usdcAmount }: { usdcAmount?: bigint }) {
  const from = usdcAmount && usdcAmount > 0n ? formatInrEquivalent(usdcAmount) : "₹5";
  const to = usdcAmount && usdcAmount > 0n ? formatInrTenX(usdcAmount) : "₹50";

  return (
    <div className="inline-flex items-center gap-4 rounded-2xl border border-black/10 bg-white px-6 py-4 shadow-sm">
      <span
        className="text-2xl font-medium text-black/50 md:text-3xl"
        style={{ letterSpacing: "-0.03em" }}
      >
        {from}
      </span>
      <span className="flex items-center gap-1 text-black/30">
        <span className="h-px w-6 bg-black/20" />
        <span className="text-lg font-medium text-[#2B2644]">→</span>
        <span className="h-px w-6 bg-black/20" />
      </span>
      <span
        className="animate-pulse text-2xl font-medium text-[#2B2644] md:text-3xl"
        style={{ letterSpacing: "-0.03em" }}
      >
        {to}
      </span>
      <span className="ml-1 text-xs font-medium uppercase tracking-wide text-black/40">
        illustrative
      </span>
    </div>
  );
}
