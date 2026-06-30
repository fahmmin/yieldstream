"use client";

import { useTreasuryApp } from "@/contexts/TreasuryAppContext";
import { CONTRACTS, NETWORK } from "@/lib/stellar";
import { AlertBanner, PageHeader, Panel, PrimaryButton } from "@/components/app/ui";

function ConfigRow({ label, value, dark = false }: { label: string; value: string; dark?: boolean }) {
  const short = value.length > 20 ? `${value.slice(0, 8)}…${value.slice(-6)}` : value;

  return (
    <div className={`flex flex-col gap-1 py-4 last:border-0 sm:flex-row sm:items-center sm:justify-between ${dark ? "border-b border-white/10" : "border-b border-black/5"}`}>
      <dt className={`text-sm font-medium ${dark ? "text-white/60" : "text-black/60"}`}>{label}</dt>
      <dd className={`font-mono text-sm ${dark ? "text-white" : "text-black"}`}>{value ? short : "Not set"}</dd>
    </div>
  );
}

export default function SettingsPage() {
  const { address, connect, loading, configured } = useTreasuryApp();

  return (
    <>
      <PageHeader
        eyebrow="Configuration"
        title="Settings"
        description="Network, wallet, and deployed Soroban contract addresses."
      />

      {!configured && (
        <AlertBanner>
          Set contract IDs in <code className="font-mono">apps/web/.env.local</code> after running the deploy scripts.
        </AlertBanner>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Panel>
          <h2 className="mb-4 text-xl font-medium text-black" style={{ letterSpacing: "-0.02em" }}>
            Wallet
          </h2>
          <dl>
            <ConfigRow label="Connected address" value={address ?? ""} />
            <ConfigRow label="Network" value={NETWORK} />
          </dl>
          {!address && (
            <PrimaryButton className="mt-6 w-full" size="lg" onClick={connect} disabled={loading}>
              {loading ? "Connecting…" : "Connect Freighter"}
            </PrimaryButton>
          )}
        </Panel>

        <Panel dark>
          <h2 className="mb-4 text-xl font-medium text-white" style={{ letterSpacing: "-0.02em" }}>
            Contracts
          </h2>
          <dl>
            <ConfigRow dark label="SY Vault" value={CONTRACTS.syVault} />
            <ConfigRow dark label="Market" value={CONTRACTS.market} />
            <ConfigRow dark label="PT Token" value={CONTRACTS.ptToken} />
            <ConfigRow dark label="YT Token" value={CONTRACTS.ytToken} />
          </dl>
        </Panel>
      </div>

      <Panel className="mt-6">
        <h2 className="mb-2 text-xl font-medium text-black" style={{ letterSpacing: "-0.02em" }}>
          Setup checklist
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-base leading-relaxed text-black/70">
          <li>Fund testnet wallet with XLM (Friendbot) and USDC.</li>
          <li>Deploy contracts with <code className="font-mono text-sm">scripts/deploy-testnet.ps1</code>.</li>
          <li>Copy contract IDs into <code className="font-mono text-sm">.env.local</code>.</li>
          <li>Connect Freighter on testnet and open the Vault page to deposit.</li>
        </ol>
      </Panel>
    </>
  );
}
