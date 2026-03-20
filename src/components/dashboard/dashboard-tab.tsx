"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Calendar as CalendarIcon, Target, TrendingUp, DollarSign, BarChart2, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis, Cell } from "recharts";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface DashboardTabProps {
  trades: any[];
  setups?: any[];
}

export function DashboardTab({ trades }: DashboardTabProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // --- Data Processing ---
  const { metrics, chartsData } = useMemo(() => {
    // Sort all trades chronological and cast Prisma Decimals to Numbers
    const sorted = [...trades].map(t => ({
      ...t,
      pnl: t.pnl ? Number(t.pnl) : 0,
      entryPrice: t.entryPrice ? Number(t.entryPrice) : 0,
      exitPrice: t.exitPrice ? Number(t.exitPrice) : 0
    })).sort((a, b) => new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime());
    
    const closed = sorted.filter((t) => t.status === "closed");
    const wins = closed.filter((t) => t.pnl && t.pnl > 0);
    const losses = closed.filter((t) => t.pnl !== null && t.pnl <= 0);

    const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
    const totalPnl = closed.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const bestTrade = closed.reduce((max, t) => Math.max(max, t.pnl || 0), 0);
    const worstTrade = closed.reduce((min, t) => Math.min(min, t.pnl || 0), 0);
    
    const avgWin = wins.length > 0 ? wins.reduce((sum, t) => sum + (t.pnl || 0), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((sum, t) => sum + (t.pnl || 0), 0) / losses.length : 0;

    // Charts: Cumulative
    let runningPnl = 0;
    const cumulative = sorted.filter(t => t.status === 'closed').map(t => {
      runningPnl += (t.pnl || 0);
      return {
        date: new Date(t.entryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        pnl: runningPnl,
      };
    });

    // Charts: Daily PnL
    const dailyMap = new Map<string, number>();
    closed.forEach(t => {
      const d = new Date(t.entryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      dailyMap.set(d, (dailyMap.get(d) || 0) + (t.pnl || 0));
    });
    const daily = Array.from(dailyMap.entries()).map(([date, pnl]) => ({ date, pnl }));

    // Charts: Symbol PnL
    const symbolMap = new Map<string, number>();
    closed.forEach(t => {
      symbolMap.set(t.symbol, (symbolMap.get(t.symbol) || 0) + (t.pnl || 0));
    });
    const symbols = Array.from(symbolMap.entries()).map(([symbol, pnl]) => ({ symbol, pnl }));

    // Charts: Win Rate over time
    let winCount = 0;
    const winRateData = closed.map((t, i) => {
      if (t.pnl && t.pnl > 0) winCount++;
      return {
        date: new Date(t.entryDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        winRate: (winCount / (i + 1)) * 100
      };
    });

    return {
      metrics: {
        totalTrades: trades.length,
        winRate,
        totalPnl,
        bestTrade,
        worstTrade,
        wins: wins.length,
        losses: losses.length,
        avgWin,
        avgLoss
      },
      chartsData: {
        cumulative,
        daily,
        symbols,
        winRateData
      }
    };
  }, [trades]);

  const pnlColor = (val: number) => val >= 0 ? "text-green-500" : "text-red-500";
  const formatMoney = (val: number) => `${val >= 0 ? "+" : "-"}$${Math.abs(val).toFixed(2)}`;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold tracking-tight">Trading Overview</h2>
        <Button variant="outline" size="sm" className="bg-card/30 border-border/40 gap-2 h-9 text-sm">
          <CalendarIcon className="h-4 w-4 text-green-500" />
          <span>All time</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card/40 border-border/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total Trades
            </CardTitle>
            <Target className="h-5 w-5 text-blue-500/70" />
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <p className="text-3xl font-bold text-blue-500">
              {metrics.totalTrades}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Win Rate
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-green-500/70" />
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <p className="text-3xl font-bold text-green-500">
              {metrics.winRate.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total PnL
            </CardTitle>
            <DollarSign className={cn("h-5 w-5", metrics.totalPnl >= 0 ? "text-green-500/70" : "text-red-500/70")} />
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <p className={cn("text-3xl font-bold", pnlColor(metrics.totalPnl))}>
              {formatMoney(metrics.totalPnl)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 pt-5 px-5">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Best Trade
            </CardTitle>
            <BarChart2 className="h-5 w-5 text-purple-500/70" />
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <p className="text-3xl font-bold text-purple-500">
              {formatMoney(metrics.bestTrade)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cumulative PnL */}
        <Card className="bg-card/40 border-border/20 shadow-sm lg:col-span-1">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-base font-medium">Cumulative PnL</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-5 pt-0 h-[280px]">
            {chartsData.cumulative.length > 0 ? (
              <ChartContainer config={{ pnl: { label: "PnL", color: "#10b981" } }} className="h-full w-full">
                <LineChart data={chartsData.cumulative} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.3)" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="stepAfter" dataKey="pnl" stroke={chartsData.cumulative[chartsData.cumulative.length - 1]?.pnl >= 0 ? "#10b981" : "#ef4444"} strokeWidth={2} dot={{ r: 3, strokeWidth: 2 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Daily PnL */}
        <Card className="bg-card/40 border-border/20 shadow-sm lg:col-span-1">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-base font-medium">Daily PnL</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-5 pt-0 h-[280px]">
            {chartsData.daily.length > 0 ? (
              <ChartContainer config={{ pnl: { label: "PnL", color: "#10b981" } }} className="h-full w-full">
                <BarChart data={chartsData.daily} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.3)" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} />
                  <YAxis tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
                    {chartsData.daily.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "#10b981" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Win Rate */}
        <Card className="bg-card/40 border-border/20 shadow-sm lg:col-span-1">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-base font-medium">Win Rate</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-5 pt-0 h-[280px]">
            {chartsData.winRateData.length > 0 ? (
              <ChartContainer config={{ winRate: { label: "Win Rate", color: "#10b981" } }} className="h-full w-full">
                <LineChart data={chartsData.winRateData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border)/0.3)" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} tickFormatter={(val) => `${val}%`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="winRate" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* PnL by Symbol */}
        <Card className="bg-card/40 border-border/20 shadow-sm lg:col-span-1">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-base font-medium">PnL by Symbol</CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-5 pt-0 h-[280px]">
            {chartsData.symbols.length > 0 ? (
              <ChartContainer config={{ pnl: { label: "PnL", color: "#10b981" } }} className="h-full w-full">
                <BarChart data={chartsData.symbols} layout="vertical" margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border)/0.3)" />
                  <XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} tickFormatter={(val) => `$${val}`} />
                  <YAxis dataKey="symbol" type="category" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12 }} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="pnl" radius={[0, 2, 2, 0]} barSize={24}>
                    {chartsData.symbols.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "#10b981" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No data available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Summary Metrics Row */}
      <Card className="bg-card/40 border-border/20 shadow-sm py-5">
        <CardContent className="p-0 flex flex-wrap justify-between divide-x divide-border/20 px-8">
          <div className="flex flex-col items-center justify-center flex-1 px-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Wins</span>
            <span className="text-xl font-bold text-green-500">{metrics.wins}</span>
          </div>
          <div className="flex flex-col items-center justify-center flex-1 px-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Losses</span>
            <span className="text-xl font-bold text-red-500">{metrics.losses}</span>
          </div>
          <div className="flex flex-col items-center justify-center flex-1 px-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Avg Win</span>
            <span className="text-xl font-bold text-green-500">{formatMoney(metrics.avgWin)}</span>
          </div>
          <div className="flex flex-col items-center justify-center flex-1 px-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Avg Loss</span>
            <span className="text-xl font-bold text-red-500">{formatMoney(Math.abs(metrics.avgLoss))}</span>
          </div>
          <div className="flex flex-col items-center justify-center flex-1 px-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Best</span>
            <span className="text-xl font-bold text-green-500">{formatMoney(metrics.bestTrade)}</span>
          </div>
          <div className="flex flex-col items-center justify-center flex-1 px-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Worst</span>
            <span className="text-xl font-bold text-red-500">{formatMoney(Math.abs(metrics.worstTrade))}</span>
          </div>
        </CardContent>
      </Card>

      {/* Positions Table */}
      <Card className="bg-card/40 border-border/20 shadow-sm">
        <CardHeader className="pb-4 pt-6 px-8">
          <CardTitle className="text-base font-medium">Positions</CardTitle>
        </CardHeader>
        <CardContent className="px-8 pb-8 pt-0">
          <div className="overflow-x-auto rounded-md">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/20 text-left">
                  <th className="pb-4 font-medium text-muted-foreground/70"><div className="flex items-center gap-1.5">Symbol <Filter className="h-3.5 w-3.5"/></div></th>
                  <th className="pb-4 font-medium text-muted-foreground/70"><div className="flex items-center gap-1.5">Market <Filter className="h-3.5 w-3.5"/></div></th>
                  <th className="pb-4 font-medium text-muted-foreground/70"><div className="flex items-center gap-1.5">Side <Filter className="h-3.5 w-3.5"/></div></th>
                  <th className="pb-4 font-medium text-muted-foreground/70"><div className="flex items-center gap-1.5">Status <Filter className="h-3.5 w-3.5"/></div></th>
                  <th className="pb-4 font-medium text-muted-foreground/70"><div className="flex items-center gap-1.5">Entry <Filter className="h-3.5 w-3.5"/></div></th>
                  <th className="pb-4 font-medium text-muted-foreground/70"><div className="flex items-center gap-1.5">Exit <Filter className="h-3.5 w-3.5"/></div></th>
                  <th className="pb-4 font-medium text-muted-foreground/70"><div className="flex items-center gap-1.5">PnL <Filter className="h-3.5 w-3.5"/></div></th>
                  <th className="pb-4 font-medium text-muted-foreground/70">Journal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {trades.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground text-sm">No positions found</td>
                  </tr>
                ) : (
                  trades.map((trade) => {
                    const isExpanded = expandedRows.has(trade.id);
                    
                    return (
                      <React.Fragment key={trade.id}>
                        <tr 
                          onClick={() => toggleRow(trade.id)}
                          className="group hover:bg-muted/10 transition-colors cursor-pointer"
                        >
                          <td className="py-4 font-medium text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-muted-foreground opacity-70">
                                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                              </span>
                              {trade.symbol}
                            </div>
                            {trade.setup && (
                              <div className="pl-6 mt-1.5">
                                <Badge variant="outline" style={{ borderColor: trade.setup.color ? `${trade.setup.color}40` : undefined, color: trade.setup.color }} className="text-[9px] px-1.5 py-0 h-4 uppercase tracking-wider bg-transparent">
                                  {trade.setup.name}
                                </Badge>
                              </div>
                            )}
                          </td>
                          <td className="py-4">
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-purple-500/10 text-purple-400 border-purple-500/20 rounded px-2 font-semibold">
                              FUTURES
                            </Badge>
                          </td>
                          <td className="py-4">
                            <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider rounded px-2 font-semibold", trade.side === 'long' ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20")}>
                              {trade.side}
                            </Badge>
                          </td>
                          <td className="py-4">
                            <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-muted/30 text-muted-foreground border-border/40 rounded px-2 font-semibold">
                              {trade.status}
                            </Badge>
                          </td>
                          <td className="py-4 text-sm font-mono">${trade.entryPrice}</td>
                          <td className="py-4 text-sm font-mono">{trade.exitPrice ? `$${trade.exitPrice}` : "-"}</td>
                          <td className={cn("py-4 text-sm font-bold", pnlColor(trade.pnl || 0))}>
                            {trade.pnl ? formatMoney(trade.pnl) : "-"}
                          </td>
                          <td className="py-4 text-sm">
                            {trade.notes || trade.setupReason ? (
                              <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-500 border-green-500/20 rounded px-2 font-semibold">
                                {trade.confidenceLevel || 6}/10
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/60 text-xs">Empty</span>
                            )}
                          </td>
                        </tr>
                        
                        {/* Expanded details row */}
                        {isExpanded && (
                          <tr className="bg-muted/5 border-b border-border/20">
                            <td colSpan={8} className="py-6 px-10 border-l-2 border-l-blue-500/50">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-6">
                                  <div>
                                    <p className="text-[11px] uppercase text-muted-foreground tracking-wider mb-1.5 font-semibold">Setup</p>
                                    <p className="text-sm font-medium">{trade.setup ? trade.setup.name : "-"}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] uppercase text-muted-foreground tracking-wider mb-1.5 font-semibold">Setup Reason</p>
                                    <p className="text-sm font-medium">{trade.setupReason || "-"}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] uppercase text-muted-foreground tracking-wider mb-1.5 font-semibold">Confidence Level</p>
                                    <div className="flex items-center gap-2">
                                      <div className="flex gap-1.5">
                                        {Array.from({ length: 10 }).map((_, i) => (
                                          <div 
                                            key={i} 
                                            className={cn(
                                              "h-2 w-2 rounded-full", 
                                              i < (trade.confidenceLevel || 0) ? "bg-green-500" : "bg-muted-foreground/20"
                                            )} 
                                          />
                                        ))}
                                      </div>
                                      <span className="text-sm text-muted-foreground">{trade.confidenceLevel || 0}/10</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-6">
                                  <div>
                                    <p className="text-[11px] uppercase text-muted-foreground tracking-wider mb-1.5 font-semibold">Psychology</p>
                                    <p className="text-sm font-medium">{trade.psychology || "-"}</p>
                                  </div>
                                </div>

                                <div className="space-y-6">
                                  <div>
                                    <p className="text-[11px] uppercase text-muted-foreground tracking-wider mb-1.5 font-semibold">Market Condition</p>
                                    <p className="text-sm font-medium">{trade.marketCondition || "-"}</p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] uppercase text-muted-foreground tracking-wider mb-1.5 font-semibold">Notes</p>
                                    <p className="text-sm text-muted-foreground">{trade.notes || "No notes available."}</p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-5 pt-5 border-t border-border/10 flex items-center justify-between text-xs text-muted-foreground">
            <span>Showing 1-{Math.min(6, trades.length)} of {trades.length} positions</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled className="h-8 text-xs bg-transparent border-border/20 text-muted-foreground/50 hover:bg-transparent">
                &lt; Previous
              </Button>
              <Button variant="outline" size="sm" disabled className="h-8 text-xs bg-transparent border-border/20 text-muted-foreground/50 hover:bg-transparent">
                Next &gt;
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
