"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { NewTradesModal } from "./new-trades-modal";
import { ClosedTradesNotification } from "./closed-trades-notification";
import { Loader2, RefreshCw } from "lucide-react";
import type { SyncedNewTrade, ClosedTradeUpdate } from "@/lib/exchange";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface TradeSyncProps {
  setups: any[];
  hasExchanges: boolean;
}

interface SyncResult {
  newTrades: SyncedNewTrade[];
  closedTrades: ClosedTradeUpdate[];
  errors: string[];
}

export function TradeSync({ setups, hasExchanges }: TradeSyncProps) {
  const router = useRouter();
  const [syncing, setSyncing] = useState(false);
  const [newTrades, setNewTrades] = useState<SyncedNewTrade[]>([]);
  const [closedTrades, setClosedTrades] = useState<ClosedTradeUpdate[]>([]);
  const [syncError, setSyncError] = useState<string | null>(null);
  const hasSynced = useRef(false);

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

      const result: SyncResult = await res.json();

      if (result.newTrades.length > 0) {
        setNewTrades(result.newTrades);
      }

      if (result.closedTrades.length > 0) {
        setClosedTrades(result.closedTrades);
      }

      if (result.errors.length > 0) {
        setSyncError(result.errors[0]);
      }

      // Refresh the page data if we got any changes
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

  // Auto-sync on mount (once)
  useEffect(() => {
    if (hasSynced.current) return;
    hasSynced.current = true;
    runSync();
  }, [runSync]);

  const handleNewTradesComplete = () => {
    setNewTrades([]);
    router.refresh();
  };

  const handleClosedDismiss = () => {
    setClosedTrades([]);
  };

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

      {/* New trades journal modal */}
      {newTrades.length > 0 && (
        <NewTradesModal
          trades={newTrades}
          setups={setups}
          onComplete={handleNewTradesComplete}
        />
      )}

      {/* Closed trades notification */}
      {closedTrades.length > 0 && (
        <ClosedTradesNotification
          trades={closedTrades}
          onDismiss={handleClosedDismiss}
        />
      )}
    </>
  );
}
