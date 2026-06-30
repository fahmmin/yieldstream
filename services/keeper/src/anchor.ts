export type AnchorConfig = {
  harborApiKey?: string;
  harborBaseUrl: string;
  withdrawThresholdUsdc: bigint;
};

export function loadAnchorConfig(): AnchorConfig {
  return {
    harborApiKey: process.env.HARBOR_API_KEY,
    harborBaseUrl:
      process.env.HARBOR_BASE_URL ?? "https://harbor-sandbox.owlpay.com",
    withdrawThresholdUsdc: BigInt(process.env.YT_CLAIM_THRESHOLD ?? "10000000"),
  };
}

/**
 * Phase 6: OwlPay Harbor off-ramp after YT yield claim.
 * Requires HARBOR_API_KEY from India wallet onboarding plan.
 */
export async function routeYieldToInrBank(
  config: AnchorConfig,
  stellarAddress: string,
  amountUsdc: bigint,
): Promise<{ status: "blocked" | "ready"; reason: string }> {
  if (!config.harborApiKey) {
    return {
      status: "blocked",
      reason: "HARBOR_API_KEY not set — complete OwlPay sandbox onboarding",
    };
  }
  console.log(
    JSON.stringify({
      scope: "anchor",
      message: "harbor_withdraw_queued",
      stellarAddress,
      amount: amountUsdc.toString(),
      baseUrl: config.harborBaseUrl,
    }),
  );
  return {
    status: "ready",
    reason: "Wire Transfer v2 stellar→INR in keeper when credentials available",
  };
}
