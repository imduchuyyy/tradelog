"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClosedTradeUpdate } from "@/lib/exchange";

interface ClosedTradesNotificationProps {
  trades: ClosedTradeUpdate[];
  onDismiss: () => void;
}

export function ClosedTradesNotification({
  trades,
  onDismiss,
}: ClosedTradesNotificationProps) {
  const [visible, setVisible] = useState(trades.length > 0);

  // Auto-dismiss after 10 seconds
  useEffect(() => {
    if (trades.length === 0) return;
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 10000);
    return () => clearTimeout(timer);
  }, [trades.length, onDismiss]);

  if (!visible || trades.length === 0) return null;

  const totalPnl = trades.reduce((sum, t) => sum + t.pnl, 0);
  const isPositive = totalPnl >= 0;

  return (
    <div className="fixed top-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)] animate-in slide-in-from-right duration-300">
      <div className="rounded-xl border border-border/60 bg-card shadow-2xl backdrop-blur-sm overflow-hidden">
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between px-4 py-3",
            isPositive
              ? "bg-green-500/10 border-b border-green-500/20"
              : "bg-red-500/10 border-b border-red-500/20"
          )}
        >
          <div className="flex items-center gap-2">
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm font-semibold">
              {trades.length} Position{trades.length > 1 ? "s" : ""} Closed
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              setVisible(false);
              onDismiss();
            }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Trade list */}
        <div className="max-h-64 overflow-y-auto divide-y divide-border/20">
          {trades.map((trade) => (
            <div
              key={trade.id}
              className="flex items-center justify-between px-4 py-2.5"
            >
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{trade.symbol}</span>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    trade.side === "long"
                      ? "border-green-500/30 text-green-500"
                      : "border-red-500/30 text-red-500"
                  )}
                >
                  {trade.side.toUpperCase()}
                </Badge>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "text-sm font-semibold",
                    trade.pnl >= 0 ? "text-green-500" : "text-red-500"
                  )}
                >
                  {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toFixed(2)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {trade.pnlPercent >= 0 ? "+" : ""}
                  {trade.pnlPercent.toFixed(2)}%
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Footer total */}
        {trades.length > 1 && (
          <div className="border-t border-border/40 px-4 py-2.5 flex justify-between items-center bg-muted/20">
            <span className="text-xs text-muted-foreground font-medium">
              Total
            </span>
            <span
              className={cn(
                "text-sm font-bold",
                isPositive ? "text-green-500" : "text-red-500"
              )}
            >
              {isPositive ? "+" : ""}${totalPnl.toFixed(2)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
