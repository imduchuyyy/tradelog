"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import type { SyncResult } from "@/lib/exchange";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface TradeSyncProps {
  setups: any[];
  hasExchanges: boolean;
}

export function TradeSync({ setups, hasExchanges }: TradeSyncProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const hasSynced = useRef(false);

  // ── Initial one-shot sync on page load ─────────────────────────────────────
  const runSync = useCallback(async () => {
    if (!hasExchanges) return;
    if (syncing) return;

    setSyncing(true);
    setSyncError(null);

    try {
      const res = await fetch("/api/trades/sync");
      if (!res.ok) {
        throw new Error(`Sync failed: ${res.status}`);
      }

      const result = await res.json();

      if (result.errors && result.errors.length > 0) {
        setSyncError(result.errors[0]);
      }

      if (result.newTrades.length > 0 || result.closedTrades.length > 0) {
        router.refresh();
      }
    } catch (err) {
      console.error("[TradeSync] Sync error:", err);
      setSyncError(
        err instanceof Error ? err.message : "Failed to sync trades"
      );
    } finally {
      setSyncing(false);
    }
  }, [hasExchanges, syncing, router]);

  // Run once on mount
  useEffect(() => {
    if (hasSynced.current) return;
    hasSynced.current = true;
    runSync();
  }, [runSync]);

  // ── Background worker: polls /api/trades/sync every 60s ────────────────────
  // The worker only posts a message when new or closed trades are detected,
  // so the UI stays quiet between changes.
  useEffect(() => {
    if (!hasExchanges || typeof window === "undefined") return;

    const worker = new Worker("/sync-worker.js");

    worker.onmessage = (e) => {
      const { type, payload } = e.data;

      if (type === "SYNC_RESULT") {
        const { newTrades: incoming, closedTrades: closed } = payload;
        if ((incoming && incoming.length > 0) || (closed && closed.length > 0)) {
          router.refresh();
        }
      } else if (type === "SYNC_ERROR") {
        setSyncError(payload);
      }
    };

    // Start background polling (first poll fires after 60s since initial
    // sync already runs on mount)
    worker.postMessage({ type: "START", payload: { interval: 60000 } });

    return () => {
      worker.postMessage({ type: "STOP" });
      worker.terminate();
    };
  }, [hasExchanges, router]);

  return (
    <>
      {/* Sync indicator */}
      {syncing && (
        <div className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-card border border-border/60 px-4 py-2 shadow-lg md:bottom-4">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
          <span className="text-xs text-muted-foreground">
            Syncing trades...
          </span>
        </div>
      )}

      {/* Sync error */}
      {syncError && !syncing && (
        <div className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-card border border-red-500/30 px-4 py-2 shadow-lg md:bottom-4">
          <span className="text-xs text-red-500">{syncError}</span>
          <button
            onClick={() => {
              setSyncError(null);
              runSync();
            }}
            className="text-muted-foreground hover:text-foreground"
          >
            <RefreshCw className="h-3 w-3" />
          </button>
        </div>
      )}
    </>
  );
}
