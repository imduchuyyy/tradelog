"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import type { TradeNotification } from "@/components/dashboard/shell";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface TradeSyncProps {
  setups: any[];
  hasExchanges: boolean;
  onTradeNotification?: (notification: TradeNotification) => void;
}

/**
 * Request browser notification permission on mount, and fire notifications
 * when new/closed trades are detected.
 */
function sendBrowserNotification(title: string, body: string) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;

  if (Notification.permission === "granted") {
    new Notification(title, {
      body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: "tradelog-sync",
    });
  }
}

export function TradeSync({
  setups,
  hasExchanges,
  onTradeNotification,
}: TradeSyncProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const hasSynced = useRef(false);

  // Request browser notification permission on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Handle sync results — notify AI chat + browser
  const handleSyncResult = useCallback(
    (result: any) => {
      const newTrades = result.newTrades || [];
      const closedTrades = result.closedTrades || [];

      // Notify for each new trade
      for (const trade of newTrades) {
        sendBrowserNotification(
          "New Trade Opened",
          `${trade.symbol} ${trade.side?.toUpperCase()} at ${trade.entryPrice || "market"}`
        );

        onTradeNotification?.({
          type: "new_trade",
          trade: {
            id: trade.id,
            symbol: trade.symbol,
            side: trade.side,
            entryPrice: trade.entryPrice ? Number(trade.entryPrice) : undefined,
            status: trade.status,
          },
        });
      }

      // Notify for each closed trade
      for (const trade of closedTrades) {
        const pnl = trade.pnl !== null && trade.pnl !== undefined ? Number(trade.pnl) : undefined;
        const isWin = pnl !== undefined && pnl > 0;

        sendBrowserNotification(
          `Trade Closed — ${isWin ? "WIN" : "LOSS"}`,
          `${trade.symbol} ${trade.side?.toUpperCase()} | PnL: $${pnl?.toFixed(2) || "N/A"}`
        );

        onTradeNotification?.({
          type: "closed_trade",
          trade: {
            id: trade.id,
            symbol: trade.symbol,
            side: trade.side,
            exitPrice: trade.exitPrice ? Number(trade.exitPrice) : undefined,
            pnl,
            status: trade.status,
          },
        });
      }

      // Refresh page data if anything changed
      if (newTrades.length > 0 || closedTrades.length > 0) {
        router.refresh();
      }
    },
    [router, onTradeNotification]
  );

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

      handleSyncResult(result);
    } catch (err) {
      console.error("[TradeSync] Sync error:", err);
      setSyncError(
        err instanceof Error ? err.message : "Failed to sync trades"
      );
    } finally {
      setSyncing(false);
    }
  }, [hasExchanges, syncing, handleSyncResult]);

  // Run once on mount
  useEffect(() => {
    if (hasSynced.current) return;
    hasSynced.current = true;
    runSync();
  }, [runSync]);

  // ── Background worker: polls /api/trades/sync every 60s ────────────────────
  useEffect(() => {
    if (!hasExchanges || typeof window === "undefined") return;

    const worker = new Worker("/sync-worker.js");

    worker.onmessage = (e) => {
      const { type, payload } = e.data;

      if (type === "SYNC_RESULT") {
        handleSyncResult(payload);
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
  }, [hasExchanges, handleSyncResult]);

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
