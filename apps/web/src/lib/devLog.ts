export type LogScope = "vault" | "market" | "freighter" | "keeper" | "blend" | "anchor";

export type DevLogEntry = {
  id: string;
  ts: string;
  flowId: string;
  scope: LogScope;
  message: string;
  data?: Record<string, unknown>;
};

const MAX_LOGS = 200;

let logs: DevLogEntry[] = [];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((fn) => fn());
}

export function subscribeDevLogs(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getDevLogs(): DevLogEntry[] {
  return logs;
}

export function devLog(
  scope: LogScope,
  message: string,
  data?: Record<string, unknown>,
  flowId = "default",
) {
  const entry: DevLogEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ts: new Date().toISOString(),
    flowId,
    scope,
    message,
    data,
  };
  logs = [entry, ...logs].slice(0, MAX_LOGS);
  if (process.env.NEXT_PUBLIC_DEV_LOGS !== "false") {
    console.log(`[yieldstream][${scope}]`, message, data ?? "");
  }
  notify();
}

export function newFlowId(): string {
  return `flow_${Date.now().toString(36)}`;
}
