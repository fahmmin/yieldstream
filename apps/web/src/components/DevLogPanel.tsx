"use client";

import { useEffect, useState } from "react";
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
    <section className="mt-6 rounded-xl border border-slate-700 bg-panel">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-200"
      >
        <span>Dev Logs ({entries.length})</span>
        <span className="text-muted">{open ? "hide" : "show"}</span>
      </button>
      {open && (
        <div className="max-h-64 overflow-y-auto border-t border-slate-700 px-4 py-2 font-mono text-xs">
          {entries.length === 0 && (
            <p className="text-muted py-4">No logs yet. Connect wallet to start.</p>
          )}
          {entries.map((e) => (
            <div key={e.id} className="border-b border-slate-800 py-2 last:border-0">
              <div className="flex gap-2 text-muted">
                <span>{e.ts.slice(11, 19)}</span>
                <span className="text-accent">[{e.scope}]</span>
                <span>{e.flowId}</span>
              </div>
              <div className="text-slate-200">{e.message}</div>
              {e.data && (
                <pre className="mt-1 whitespace-pre-wrap text-slate-400">
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
