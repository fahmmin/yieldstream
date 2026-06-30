"use client";

import { useCallback, useState } from "react";
import {
  isConnected,
  getAddress,
  getNetwork,
  setAllowed,
  signTransaction,
} from "@stellar/freighter-api";
import { devLog, newFlowId } from "@/lib/devLog";
import { NETWORK, PASSPHRASE } from "@/lib/stellar";
import { logConnect } from "@/components/DevLogPanel";

export function useFreighter() {
  const [address, setAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connect = useCallback(async () => {
    const flowId = newFlowId();
    setLoading(true);
    setError(null);
    try {
      await setAllowed();
      const connected = await isConnected();
      if (!connected) {
        throw new Error("Freighter not connected");
      }
      const net = await getNetwork();
      if (net.network !== NETWORK) {
        devLog(
          "freighter",
          "network_mismatch",
          { expected: NETWORK, got: net.network },
          flowId,
        );
      }
      const addr = await getAddress();
      setAddress(addr.address);
      logConnect(addr.address, flowId);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Connect failed";
      setError(msg);
      devLog("freighter", "connect_error", { msg }, flowId);
    } finally {
      setLoading(false);
    }
  }, []);

  const sign = useCallback(async (xdr: string) => {
    const flowId = newFlowId();
    const result = await signTransaction(xdr, {
      networkPassphrase: PASSPHRASE,
      address: address ?? undefined,
    });
    if ("error" in result && result.error) {
      devLog("freighter", "sign_error", { error: result.error }, flowId);
      throw new Error(result.error);
    }
    devLog("freighter", "tx_signed", {}, flowId);
    return result.signedTxXdr;
  }, [address]);

  return { address, loading, error, connect, sign };
}
