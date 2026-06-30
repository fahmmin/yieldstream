import { AppShell } from "@/components/app/AppShell";
import { TreasuryAppProvider } from "@/contexts/TreasuryAppContext";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Treasury — YieldStream",
  description: "Soroban testnet yield stripping — SY vault, PT/YT market",
};

export default function TreasuryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TreasuryAppProvider>
      <AppShell>{children}</AppShell>
    </TreasuryAppProvider>
  );
}
