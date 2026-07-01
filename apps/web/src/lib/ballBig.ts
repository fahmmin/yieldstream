/** Dust yield threshold: 0.5 USDC at 7 decimals */
export const DUST_YIELD_THRESHOLD = 5_000_000n;

/** Illustrative INR rate for storytelling only — not a live feed */
export const USDC_TO_INR = 85;

export type MockMarket = {
  id: string;
  question: string;
  yesPrice: number;
  volume: string;
  resolvesIn: string;
};

export const MOCK_HIGH_STAKES_MARKETS: MockMarket[] = [
  {
    id: "fed-q3",
    question: "Fed cuts rates before Q3 2026?",
    yesPrice: 0.42,
    volume: "$2.4M",
    resolvesIn: "89 days",
  },
  {
    id: "btc-120k",
    question: "BTC above $120k by July 2026?",
    yesPrice: 0.31,
    volume: "$8.1M",
    resolvesIn: "30 days",
  },
  {
    id: "eth-flip",
    question: "ETH flips BTC market cap in 2026?",
    yesPrice: 0.08,
    volume: "$1.2M",
    resolvesIn: "214 days",
  },
];

export function isDustYield(amount: bigint): boolean {
  return amount > 0n && amount < DUST_YIELD_THRESHOLD;
}

/** Convert 7-decimal USDC bigint to illustrative INR string */
export function formatInrEquivalent(usdcAmount: bigint): string {
  const usdc = Number(usdcAmount) / 10_000_000;
  const inr = Math.round(usdc * USDC_TO_INR);
  if (inr < 1) return "< ₹1";
  return `₹${inr.toLocaleString("en-IN")}`;
}

/** Illustrative 10x target for teaser UI */
export function formatInrTenX(usdcAmount: bigint): string {
  const usdc = Number(usdcAmount) / 10_000_000;
  const inr = Math.round(usdc * USDC_TO_INR * 10);
  if (inr < 1) return "< ₹10";
  return `₹${inr.toLocaleString("en-IN")}`;
}
