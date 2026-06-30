"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useFreighter } from "@/hooks/useFreighter";
import { useTreasury } from "@/hooks/useTreasury";

type TreasuryAppContextValue = ReturnType<typeof useFreighter> & ReturnType<typeof useTreasury>;

const TreasuryAppContext = createContext<TreasuryAppContextValue | null>(null);

export function TreasuryAppProvider({ children }: { children: ReactNode }) {
  const freighter = useFreighter();
  const treasury = useTreasury(freighter.address, freighter.sign);

  return (
    <TreasuryAppContext.Provider value={{ ...freighter, ...treasury }}>
      {children}
    </TreasuryAppContext.Provider>
  );
}

export function useTreasuryApp() {
  const ctx = useContext(TreasuryAppContext);
  if (!ctx) {
    throw new Error("useTreasuryApp must be used within TreasuryAppProvider");
  }
  return ctx;
}
