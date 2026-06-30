"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  devLog,
  getDevLogs,
  subscribeDevLogs,
  type DevLogEntry,
} from "@/lib/devLog";

export function DevLogPanel() {
  const [entries, setEntries] = useState<DevLogEntry[]>([]);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    setEntries(getDevLogs());
    return subscribeDevLogs(() => setEntries(getDevLogs()));
  }, []);

  return (
    <section className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-6 py-5 text-left"
      >
        <div>
          <p className="text-lg font-medium text-black" style={{ letterSpacing: "-0.02em" }}>
            Session logs
          </p>
          <p className="text-sm text-black/50">{entries.length} events recorded</p>
        </div>
        <span className="flex items-center gap-2 text-sm font-medium text-black/60">
          {open ? "Hide" : "Show"}
          {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </span>
      </button>
      {open && (
        <div className="max-h-[32rem] overflow-y-auto border-t border-black/5 px-6 py-4 font-mono text-xs">
          {entries.length === 0 && (
            <p className="py-12 text-center text-sm text-black/50">
              No logs yet. Connect your wallet and run a transaction to see activity here.
            </p>
          )}
          {entries.map((e) => (
            <div key={e.id} className="border-b border-black/5 py-4 last:border-0">
              <div className="flex flex-wrap gap-2 text-black/50">
                <span>{e.ts.slice(11, 19)}</span>
                <span className="font-medium text-black/70">[{e.scope}]</span>
                <span>{e.flowId}</span>
              </div>
              <div className="mt-1 text-sm text-black">{e.message}</div>
              {e.data && (
                <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-[#F5F5F5] p-3 text-black/60">
                  {JSON.stringify(e.data, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function logConnect(address: string, flowId: string) {
  devLog("freighter", "wallet_connected", { address }, flowId);
}
