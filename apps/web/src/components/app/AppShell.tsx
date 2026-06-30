"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  ArrowLeftRight,
  LayoutDashboard,
  Menu,
  Settings,
  Vault,
  X,
} from "lucide-react";
import { useState } from "react";
import { LogoIcon } from "@/components/landing/LogoIcon";
import { useTreasuryApp } from "@/contexts/TreasuryAppContext";
import { NETWORK } from "@/lib/stellar";
import { PrimaryButton } from "./ui";

const NAV_ITEMS: Array<{
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}> = [
  { href: "/treasury", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/treasury/vault", label: "Vault", icon: Vault },
  { href: "/treasury/market", label: "Market", icon: ArrowLeftRight },
  { href: "/treasury/activity", label: "Activity", icon: Activity },
  { href: "/treasury/settings", label: "Settings", icon: Settings },
];

function WalletChip() {
  const { address, connect, loading } = useTreasuryApp();

  if (address) {
    return (
      <div className="rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium text-black">
        {address.slice(0, 6)}…{address.slice(-4)}
      </div>
    );
  }

  return (
    <PrimaryButton size="md" onClick={connect} disabled={loading}>
      {loading ? "Connecting…" : "Connect Freighter"}
    </PrimaryButton>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV_ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium transition-colors duration-200 ${
              active
                ? "bg-black text-white"
                : "text-black/70 hover:bg-black/5 hover:text-black"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app min-h-screen bg-[#F5F5F5]">
      <div className="mx-auto flex min-h-screen max-w-[88rem]">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-black/5 bg-[#F5F5F5] md:flex lg:w-72">
          <div className="px-6 py-6">
            <Link href="/" className="flex items-center gap-2.5">
              <LogoIcon className="h-7 w-7 text-black" />
              <span className="text-xl font-medium tracking-tight text-black">YieldStream</span>
            </Link>
            <p className="mt-2 text-xs text-black/50">Soroban {NETWORK}</p>
          </div>
          <SidebarNav />
          <div className="mt-auto border-t border-black/5 p-4">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-black/60 transition-colors hover:bg-black/5 hover:text-black"
            >
              ← Back to site
            </Link>
          </div>
        </aside>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-black/30"
              onClick={() => setMobileOpen(false)}
            />
            <aside className="relative flex h-full w-[min(20rem,85vw)] flex-col bg-[#F5F5F5] shadow-xl">
              <div className="flex items-center justify-between px-6 py-5">
                <Link href="/" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
                  <LogoIcon className="h-6 w-6 text-black" />
                  <span className="text-lg font-medium text-black">YieldStream</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-full p-2 text-black/60 hover:bg-black/5"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </aside>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-black/5 bg-[#F5F5F5]/90 px-4 py-4 backdrop-blur md:px-8">
            <button
              type="button"
              className="rounded-full p-2 text-black md:hidden"
              onClick={() => setMobileOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            <p className="hidden text-sm text-black/50 md:block">Treasury · Testnet MVP</p>
            <WalletChip />
          </header>

          <main className="flex-1 px-4 py-8 md:px-8 md:py-10">{children}</main>
        </div>
      </div>
    </div>
  );
}
