"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface TradeSyncProps {
  hasExchanges: boolean;
  /** Increment this to trigger a manual sync */
  syncTrigger: number;
  /** Called with the count of newly synced trades */
  onNewTrades?: (count: number) => void;
}

export function TradeSync({
  hasExchanges,
  syncTrigger,
  onNewTrades,
}: TradeSyncProps) {
  const t = useTranslations("sync");
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const prevTrigger = useRef(syncTrigger);

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

  // Request browser notification permission on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const runSync = useCallback(async () => {
    if (!hasExchanges) return;
    if (syncing) return;

    setSyncing(true);
    setSyncError(null);
    setSyncSuccess(null);

    try {
      const res = await fetch("/api/trades/sync");
      if (!res.ok) {
        throw new Error(`Sync failed: ${res.status}`);
      }

      const result = await res.json();

      if (result.errors && result.errors.length > 0) {
        setSyncError(result.errors[0]);
      }

      const newTrades = result.newTrades || [];
      const closedTrades = result.closedTrades || [];
      const totalNew = newTrades.length + closedTrades.length;

      // Notify for each new trade
      for (const trade of newTrades) {
        sendBrowserNotification(
          t("newTradeOpened"),
          `${trade.symbol} ${trade.side?.toUpperCase()} at ${trade.entryPrice || "market"}`
        );
      }

      // Notify for each closed trade
      for (const trade of closedTrades) {
        const pnl = trade.pnl !== null && trade.pnl !== undefined ? Number(trade.pnl) : undefined;
        const isWin = pnl !== undefined && pnl > 0;
        sendBrowserNotification(
          `${t("tradeClosed")} — ${isWin ? t("win") : t("loss")}`,
          `${trade.symbol} ${trade.side?.toUpperCase()} | PnL: $${pnl?.toFixed(2) || "N/A"}`
        );
      }

      if (totalNew > 0) {
        onNewTrades?.(totalNew);
        setSyncSuccess(
          totalNew > 1
            ? t("tradesSyncedPlural", { count: totalNew })
            : t("tradesSynced", { count: totalNew })
        );
        router.refresh();
      } else {
        setSyncSuccess(t("allUpToDate"));
      }

      // Clear success message after 5s
      setTimeout(() => setSyncSuccess(null), 5000);
    } catch (err) {
      console.error("[TradeSync] Sync error:", err);
      setSyncError(
        err instanceof Error ? err.message : t("failedToSync")
      );
    } finally {
      setSyncing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasExchanges, syncing, router, onNewTrades, t]);

  // Watch syncTrigger for manual sync requests
  useEffect(() => {
    if (syncTrigger !== prevTrigger.current) {
      prevTrigger.current = syncTrigger;
      runSync();
    }
  }, [syncTrigger, runSync]);

  return (
    <>
      {/* Sync indicator */}
      {syncing && (
        <div className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 md:bottom-4">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground" />
          <span className="text-xs text-muted-foreground">
            {t("syncing")}
          </span>
        </div>
      )}

      {/* Sync success */}
      {syncSuccess && !syncing && (
        <div className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 md:bottom-4">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          <span className="text-xs text-success">{syncSuccess}</span>
        </div>
      )}

      {/* Sync error */}
      {syncError && !syncing && (
        <div className="fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full bg-card border border-border px-4 py-2 md:bottom-4">
          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
          <span className="text-xs text-destructive">{syncError}</span>
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
