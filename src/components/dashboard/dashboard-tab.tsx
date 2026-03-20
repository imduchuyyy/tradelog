"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowDown,
  ArrowUp,
  Plus,
  TrendingDown,
  TrendingUp,
  Trash2,
} from "lucide-react";
import { createTrade, deleteTrade } from "@/app/actions";
import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface DashboardTabProps {
  trades: any[];
  setups: any[];
}

export function DashboardTab({ trades, setups }: DashboardTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Calculate stats
  const closedTrades = trades.filter((t: any) => t.status === "closed");
  const winningTrades = closedTrades.filter((t: any) => t.pnl && t.pnl > 0);
  const losingTrades = closedTrades.filter((t: any) => t.pnl && t.pnl < 0);
  const winRate =
    closedTrades.length > 0
      ? ((winningTrades.length / closedTrades.length) * 100).toFixed(1)
      : "0";
  const totalPnl = closedTrades.reduce(
    (sum: number, t: any) => sum + (t.pnl || 0),
    0
  );
  const avgWin =
    winningTrades.length > 0
      ? winningTrades.reduce((sum: number, t: any) => sum + (t.pnl || 0), 0) /
        winningTrades.length
      : 0;
  const avgLoss =
    losingTrades.length > 0
      ? Math.abs(
          losingTrades.reduce(
            (sum: number, t: any) => sum + (t.pnl || 0),
            0
          ) / losingTrades.length
        )
      : 0;
  const riskReward = avgLoss > 0 ? (avgWin / avgLoss).toFixed(2) : "N/A";

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/40 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Win Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{winRate}%</p>
            <p className="text-xs text-muted-foreground">
              {winningTrades.length}W / {losingTrades.length}L
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total PnL
            </CardTitle>
            {totalPnl >= 0 ? (
              <ArrowUp className="h-4 w-4 text-green-500" />
            ) : (
              <ArrowDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-2xl font-bold",
                totalPnl >= 0 ? "text-green-500" : "text-red-500"
              )}
            >
              {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">
              {closedTrades.length} closed trades
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Trades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{trades.length}</p>
            <p className="text-xs text-muted-foreground">
              {trades.filter((t: any) => t.status === "open").length} open
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/40 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Avg R:R
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-500">
              {riskReward}
              {riskReward !== "N/A" && ":1"}
            </p>
            <p className="text-xs text-muted-foreground">Risk to reward</p>
          </CardContent>
        </Card>
      </div>

      {/* Trades table */}
      <Card className="border-border/40 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Trades</CardTitle>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger
              render={
                <Button size="sm" className="gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0" />
              }
            >
              <Plus className="h-3.5 w-3.5" />
              Add Trade
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>New Trade</DialogTitle>
              </DialogHeader>
              <form
                action={async (formData) => {
                  await createTrade(formData);
                  setDialogOpen(false);
                }}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="symbol">Symbol *</Label>
                    <Input
                      id="symbol"
                      name="symbol"
                      placeholder="BTCUSDT"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="side">Side *</Label>
                    <select
                      id="side"
                      name="side"
                      required
                      className="flex h-8 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    >
                      <option value="long">Long</option>
                      <option value="short">Short</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entryPrice">Entry Price *</Label>
                    <Input
                      id="entryPrice"
                      name="entryPrice"
                      type="number"
                      step="any"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exitPrice">Exit Price</Label>
                    <Input
                      id="exitPrice"
                      name="exitPrice"
                      type="number"
                      step="any"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity *</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      step="any"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="leverage">Leverage</Label>
                    <Input
                      id="leverage"
                      name="leverage"
                      type="number"
                      step="any"
                      defaultValue="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="stopLoss">Stop Loss</Label>
                    <Input
                      id="stopLoss"
                      name="stopLoss"
                      type="number"
                      step="any"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="takeProfit">Take Profit</Label>
                    <Input
                      id="takeProfit"
                      name="takeProfit"
                      type="number"
                      step="any"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pnl">PnL ($)</Label>
                    <Input
                      id="pnl"
                      name="pnl"
                      type="number"
                      step="any"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pnlPercent">PnL (%)</Label>
                    <Input
                      id="pnlPercent"
                      name="pnlPercent"
                      type="number"
                      step="any"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fees">Fees</Label>
                    <Input
                      id="fees"
                      name="fees"
                      type="number"
                      step="any"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <select
                      id="status"
                      name="status"
                      className="flex h-8 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    >
                      <option value="open">Open</option>
                      <option value="closed">Closed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="setupId">Setup</Label>
                    <select
                      id="setupId"
                      name="setupId"
                      className="flex h-8 w-full rounded-lg border border-border bg-background px-3 text-sm"
                    >
                      <option value="">None</option>
                      {setups.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confidenceLevel">Confidence (1-10)</Label>
                    <Input
                      id="confidenceLevel"
                      name="confidenceLevel"
                      type="number"
                      min="1"
                      max="10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="entryDate">Entry Date</Label>
                    <Input
                      id="entryDate"
                      name="entryDate"
                      type="datetime-local"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="exitDate">Exit Date</Label>
                    <Input
                      id="exitDate"
                      name="exitDate"
                      type="datetime-local"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="marketCondition">Market Condition</Label>
                  <select
                    id="marketCondition"
                    name="marketCondition"
                    className="flex h-8 w-full rounded-lg border border-border bg-background px-3 text-sm"
                  >
                    <option value="">Select...</option>
                    <option value="trending">Trending</option>
                    <option value="ranging">Ranging</option>
                    <option value="volatile">Volatile</option>
                    <option value="calm">Calm</option>
                    <option value="breakout">Breakout</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="setupReason">Setup Reason</Label>
                  <Textarea
                    id="setupReason"
                    name="setupReason"
                    placeholder="Why did you enter this trade?"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="psychology">Psychology / Mindset</Label>
                  <Textarea
                    id="psychology"
                    name="psychology"
                    placeholder="How were you feeling?"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Additional notes..."
                    rows={2}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0"
                >
                  Create Trade
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {trades.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <TrendingUp className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                No trades yet. Start by adding your first trade.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 text-left">
                    <th className="pb-3 font-medium text-muted-foreground">
                      Symbol
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Side
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Entry
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Exit
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      PnL
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Status
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Setup
                    </th>
                    <th className="pb-3 font-medium text-muted-foreground">
                      Date
                    </th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade: any) => (
                    <tr
                      key={trade.id}
                      className="border-b border-border/20 hover:bg-muted/30"
                    >
                      <td className="py-3 font-medium">{trade.symbol}</td>
                      <td className="py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            trade.side === "long"
                              ? "border-green-500/30 text-green-500"
                              : "border-red-500/30 text-red-500"
                          )}
                        >
                          {trade.side.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="py-3">${trade.entryPrice}</td>
                      <td className="py-3">
                        {trade.exitPrice ? `$${trade.exitPrice}` : "-"}
                      </td>
                      <td
                        className={cn(
                          "py-3 font-medium",
                          trade.pnl && trade.pnl > 0
                            ? "text-green-500"
                            : trade.pnl && trade.pnl < 0
                            ? "text-red-500"
                            : ""
                        )}
                      >
                        {trade.pnl
                          ? `${trade.pnl > 0 ? "+" : ""}$${trade.pnl.toFixed(2)}`
                          : "-"}
                      </td>
                      <td className="py-3">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            trade.status === "open"
                              ? "border-blue-500/30 text-blue-500"
                              : trade.status === "closed"
                              ? "border-muted-foreground/30"
                              : "border-yellow-500/30 text-yellow-500"
                          )}
                        >
                          {trade.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {trade.setup?.name || "-"}
                      </td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(trade.entryDate).toLocaleDateString()}
                      </td>
                      <td className="py-3">
                        <form action={deleteTrade.bind(null, trade.id)}>
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            type="submit"
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
