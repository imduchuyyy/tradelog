"use client";

import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ChevronDown,
  ChevronRight,
  Target,
  TrendingUp,
  TrendingDown,
  DollarSign,
  BarChart2,
  Edit,
  CheckSquare,
  Zap,
  Trophy,
  AlertTriangle,
  Search,
  Percent,
  Scale,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface DashboardTabProps {
  trades: any[];
  setups?: any[];
  conditions?: any[];
  onOpenChat?: (context: any) => void;
}

export function DashboardTab({
  trades,
  setups,
  conditions = [],
  onOpenChat,
}: DashboardTabProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [conditionFilter, setConditionFilter] = useState<string>("");

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  // Filter conditions based on text input
  const matchedConditions = useMemo(() => {
    if (!conditionFilter.trim()) return [];
    const search = conditionFilter.toLowerCase();
    return conditions.filter((c) =>
      c.name.toLowerCase().includes(search)
    );
  }, [conditions, conditionFilter]);

  // --- Data Processing ---
  const { metrics, chartsData, conditionPerformance } = useMemo(() => {
    // 1. Filter by Condition (text-based search)
    let filteredTrades = [...trades];
    if (conditionFilter.trim() && matchedConditions.length > 0) {
      const matchedIds = new Set(matchedConditions.map((c: any) => c.id));
      filteredTrades = filteredTrades.filter(
        (t) =>
          t.conditions?.some((c: any) => matchedIds.has(c.id)) ||
          t.setup?.conditions?.some((c: any) => matchedIds.has(c.id))
      );
    }

    // Sort chronological and cast Prisma Decimals to Numbers
    const sorted = filteredTrades
      .map((t) => ({
        ...t,
        pnl: t.pnl ? Number(t.pnl) : 0,
        entryPrice: t.entryPrice ? Number(t.entryPrice) : 0,
        exitPrice: t.exitPrice ? Number(t.exitPrice) : 0,
      }))
      .sort(
        (a, b) =>
          new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
      );

    const closed = sorted.filter((t) => t.status === "closed");
    const open = sorted.filter((t) => t.status === "open");
    const wins = closed.filter((t) => t.pnl && t.pnl > 0);
    const losses = closed.filter((t) => t.pnl !== null && t.pnl <= 0);

    const winRate =
      closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
    const totalPnl = closed.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const bestTrade = closed.reduce(
      (max, t) => Math.max(max, t.pnl || 0),
      0
    );
    const worstTrade = closed.reduce(
      (min, t) => Math.min(min, t.pnl || 0),
      0
    );

    const avgWin =
      wins.length > 0
        ? wins.reduce((sum, t) => sum + (t.pnl || 0), 0) / wins.length
        : 0;
    const avgLoss =
      losses.length > 0
        ? losses.reduce((sum, t) => sum + (t.pnl || 0), 0) / losses.length
        : 0;
    const riskReward = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

    // Profit Factor
    const grossWin = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossLoss = Math.abs(
      losses.reduce((sum, t) => sum + (t.pnl || 0), 0)
    );
    const profitFactor = grossLoss !== 0 ? grossWin / grossLoss : 0;

    // Streaks
    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let tempStreak = 0;
    for (const t of closed) {
      const isWin = (t.pnl || 0) > 0;
      if (isWin) {
        if (tempStreak > 0) tempStreak++;
        else tempStreak = 1;
        maxWinStreak = Math.max(maxWinStreak, tempStreak);
      } else {
        if (tempStreak < 0) tempStreak--;
        else tempStreak = -1;
        maxLossStreak = Math.max(maxLossStreak, Math.abs(tempStreak));
      }
      currentStreak = tempStreak;
    }

    // Charts: Cumulative
    let runningPnl = 0;
    const cumulative = closed.map((t) => {
      runningPnl += t.pnl || 0;
      return {
        date: new Date(t.entryDate).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        pnl: runningPnl,
      };
    });

    // Charts: Setup Performance
    const setupMap = new Map<
      string,
      { pnl: number; wins: number; total: number }
    >();
    closed.forEach((t) => {
      const sName = t.setup?.name || "No Setup";
      const existing = setupMap.get(sName) || { pnl: 0, wins: 0, total: 0 };
      existing.pnl += t.pnl || 0;
      existing.total++;
      if (t.pnl && t.pnl > 0) existing.wins++;
      setupMap.set(sName, existing);
    });
    const setupsData = Array.from(setupMap.entries())
      .map(([name, stats]) => ({
        name,
        pnl: stats.pnl,
        winRate: (stats.wins / stats.total) * 100,
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 8);

    // Charts: Condition Performance
    const condMap = new Map<
      string,
      { pnl: number; wins: number; total: number }
    >();
    closed.forEach((t) => {
      const tradeConditions = t.conditions || [];
      if (tradeConditions.length === 0) return;
      tradeConditions.forEach((c: any) => {
        const existing = condMap.get(c.name) || {
          pnl: 0,
          wins: 0,
          total: 0,
        };
        existing.pnl += t.pnl || 0;
        existing.total++;
        if (t.pnl && t.pnl > 0) existing.wins++;
        condMap.set(c.name, existing);
      });
    });
    const conditionsData = Array.from(condMap.entries())
      .map(([name, stats]) => ({
        name,
        pnl: stats.pnl,
        winRate: (stats.wins / stats.total) * 100,
        trades: stats.total,
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 10);

    // Best & Worst conditions
    const bestCondition =
      conditionsData.length > 0 ? conditionsData[0] : null;
    const worstCondition =
      conditionsData.length > 0
        ? conditionsData[conditionsData.length - 1]
        : null;

    // Charts: Win Rate over time
    let winCount = 0;
    const winRateData = closed.map((t, i) => {
      if (t.pnl && t.pnl > 0) winCount++;
      return {
        date: new Date(t.entryDate).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        winRate: (winCount / (i + 1)) * 100,
      };
    });

    return {
      metrics: {
        totalTrades: filteredTrades.length,
        closedTrades: closed.length,
        openTrades: open.length,
        winRate,
        totalPnl,
        bestTrade,
        worstTrade,
        wins: wins.length,
        losses: losses.length,
        avgWin,
        avgLoss,
        riskReward,
        profitFactor,
        currentStreak,
        maxWinStreak,
        maxLossStreak,
      },
      chartsData: {
        cumulative,
        setupsData,
        conditionsData,
        winRateData,
      },
      conditionPerformance: {
        bestCondition,
        worstCondition,
        all: conditionsData,
      },
    };
  }, [trades, conditionFilter, matchedConditions]);

  const pnlColor = (val: number) =>
    val >= 0 ? "text-green-500" : "text-red-500";
  const formatMoney = (val: number) =>
    `${val >= 0 ? "+" : "-"}$${Math.abs(val).toFixed(2)}`;

  const getConfidenceColor = (level?: number | null) => {
    if (!level) return "bg-green-500/10 text-green-500 border-green-500/20";
    if (level >= 8)
      return "bg-green-500/10 text-green-500 border-green-500/20";
    if (level >= 5)
      return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
    return "bg-red-500/10 text-red-500 border-red-500/20";
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header with condition filter */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <h2 className="text-2xl font-bold tracking-tight">Trading Overview</h2>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <Input
              value={conditionFilter}
              onChange={(e) => setConditionFilter(e.target.value)}
              placeholder="Filter by market condition..."
              className="pl-9 h-9 w-64 bg-card/30 border-border/40 text-sm"
            />
            {conditionFilter && matchedConditions.length > 0 && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Badge
                  variant="outline"
                  className="text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/20"
                >
                  {matchedConditions.length} matched
                </Badge>
              </div>
            )}
          </div>
          {conditionFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setConditionFilter("")}
              className="h-9 text-xs text-muted-foreground"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Top Stats Cards - 6 columns */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-card/40 border-border/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total Trades
            </CardTitle>
            <Target className="h-4 w-4 text-blue-500/70" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-blue-500">
              {metrics.totalTrades}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {metrics.openTrades} open / {metrics.closedTrades} closed
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Win Rate
            </CardTitle>
            <Percent className="h-4 w-4 text-green-500/70" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-green-500">
              {metrics.winRate.toFixed(1)}%
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {metrics.wins}W / {metrics.losses}L
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Total PnL
            </CardTitle>
            <DollarSign
              className={cn(
                "h-4 w-4",
                metrics.totalPnl >= 0 ? "text-green-500/70" : "text-red-500/70"
              )}
            />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p
              className={cn("text-2xl font-bold", pnlColor(metrics.totalPnl))}
            >
              {formatMoney(metrics.totalPnl)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Risk / Reward
            </CardTitle>
            <Scale className="h-4 w-4 text-purple-500/70" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-purple-500">
              {metrics.riskReward.toFixed(2)}x
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              PF: {metrics.profitFactor.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Best Trade
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500/70" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-green-500">
              {formatMoney(metrics.bestTrade)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/20 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-1 pt-4 px-4">
            <CardTitle className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Worst Trade
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500/70" />
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-2xl font-bold text-red-500">
              {formatMoney(metrics.worstTrade)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Best & Worst Market Conditions */}
      {(conditionPerformance.bestCondition ||
        conditionPerformance.worstCondition) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {conditionPerformance.bestCondition && (
            <Card className="bg-gradient-to-br from-green-500/5 to-emerald-500/5 border-green-500/20 shadow-sm">
              <CardContent className="flex items-center gap-4 py-5 px-6">
                <div className="h-12 w-12 rounded-2xl bg-green-500/10 flex items-center justify-center shrink-0">
                  <Trophy className="h-6 w-6 text-green-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-semibold text-green-500/70 uppercase tracking-wider mb-0.5">
                    Best Market Condition
                  </p>
                  <p className="text-lg font-bold text-foreground truncate">
                    {conditionPerformance.bestCondition.name}
                  </p>
                  <div className="flex gap-4 mt-1">
                    <span className="text-xs text-muted-foreground">
                      PnL:{" "}
                      <span className="text-green-500 font-semibold">
                        {formatMoney(conditionPerformance.bestCondition.pnl)}
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Win Rate:{" "}
                      <span className="text-green-500 font-semibold">
                        {conditionPerformance.bestCondition.winRate.toFixed(0)}%
                      </span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Trades:{" "}
                      <span className="font-semibold">
                        {conditionPerformance.bestCondition.trades}
                      </span>
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {conditionPerformance.worstCondition &&
            conditionPerformance.worstCondition.name !==
              conditionPerformance.bestCondition?.name && (
              <Card className="bg-gradient-to-br from-red-500/5 to-orange-500/5 border-red-500/20 shadow-sm">
                <CardContent className="flex items-center gap-4 py-5 px-6">
                  <div className="h-12 w-12 rounded-2xl bg-red-500/10 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-6 w-6 text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold text-red-500/70 uppercase tracking-wider mb-0.5">
                      Worst Market Condition
                    </p>
                    <p className="text-lg font-bold text-foreground truncate">
                      {conditionPerformance.worstCondition.name}
                    </p>
                    <div className="flex gap-4 mt-1">
                      <span className="text-xs text-muted-foreground">
                        PnL:{" "}
                        <span className="text-red-500 font-semibold">
                          {formatMoney(
                            conditionPerformance.worstCondition.pnl
                          )}
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Win Rate:{" "}
                        <span className="text-red-500 font-semibold">
                          {conditionPerformance.worstCondition.winRate.toFixed(
                            0
                          )}
                          %
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Trades:{" "}
                        <span className="font-semibold">
                          {conditionPerformance.worstCondition.trades}
                        </span>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
        </div>
      )}

      {/* Summary Metrics Row */}
      <Card className="bg-card/40 border-border/20 shadow-sm py-5">
        <CardContent className="p-0 flex flex-wrap justify-between divide-x divide-border/20 px-8">
          <div className="flex flex-col items-center justify-center flex-1 px-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Avg Win
            </span>
            <span className="text-xl font-bold text-green-500">
              {formatMoney(metrics.avgWin)}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center flex-1 px-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Avg Loss
            </span>
            <span className="text-xl font-bold text-red-500">
              {formatMoney(metrics.avgLoss)}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center flex-1 px-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Win Streak
            </span>
            <span className="text-xl font-bold text-green-500">
              {metrics.maxWinStreak}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center flex-1 px-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Loss Streak
            </span>
            <span className="text-xl font-bold text-red-500">
              {metrics.maxLossStreak}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center flex-1 px-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Current
            </span>
            <span
              className={cn(
                "text-xl font-bold",
                metrics.currentStreak > 0 ? "text-green-500" : "text-red-500"
              )}
            >
              {metrics.currentStreak > 0 ? "+" : ""}
              {metrics.currentStreak}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center flex-1 px-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
              Profit Factor
            </span>
            <span className="text-xl font-bold text-blue-500">
              {metrics.profitFactor.toFixed(2)}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cumulative PnL */}
        <Card className="bg-card/40 border-border/20 shadow-sm lg:col-span-1">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-base font-medium">
              Cumulative PnL
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-5 pt-0 h-[280px]">
            {chartsData.cumulative.length > 0 ? (
              <ChartContainer
                config={{ pnl: { label: "PnL", color: "#10b981" } }}
                className="h-full w-full"
              >
                <LineChart
                  data={chartsData.cumulative}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border)/0.3)"
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="stepAfter"
                    dataKey="pnl"
                    stroke={
                      chartsData.cumulative[chartsData.cumulative.length - 1]
                        ?.pnl >= 0
                        ? "#10b981"
                        : "#ef4444"
                    }
                    strokeWidth={2}
                    dot={{ r: 3, strokeWidth: 2 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Win Rate Chart */}
        <Card className="bg-card/40 border-border/20 shadow-sm lg:col-span-1">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-base font-medium">
              Win Rate Over Time
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-5 pt-0 h-[280px]">
            {chartsData.winRateData.length > 0 ? (
              <ChartContainer
                config={{
                  winRate: { label: "Win Rate", color: "#10b981" },
                }}
                className="h-full w-full"
              >
                <LineChart
                  data={chartsData.winRateData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="hsl(var(--border)/0.3)"
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(val) => `${val}%`}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="winRate"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#10b981", strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Condition Performance */}
        <Card className="bg-card/40 border-border/20 shadow-sm lg:col-span-1">
          <CardHeader className="pb-2 pt-5 px-5">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <CardTitle className="text-base font-medium">
                Performance by Market Condition
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-5 pt-0 h-[280px]">
            {chartsData.conditionsData.length > 0 ? (
              <ChartContainer
                config={{ pnl: { label: "PnL", color: "#10b981" } }}
                className="h-full w-full"
              >
                <BarChart
                  data={chartsData.conditionsData}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 30, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="hsl(var(--border)/0.3)"
                  />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 11 }}
                    width={120}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="pnl" radius={[0, 2, 2, 0]} barSize={24}>
                    {chartsData.conditionsData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.pnl >= 0 ? "#10b981" : "#ef4444"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No condition data yet
              </div>
            )}
          </CardContent>
        </Card>

        {/* Setup Performance */}
        <Card className="bg-card/40 border-border/20 shadow-sm lg:col-span-1">
          <CardHeader className="pb-2 pt-5 px-5">
            <CardTitle className="text-base font-medium">
              Performance by Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-5 pt-0 h-[280px]">
            {chartsData.setupsData.length > 0 ? (
              <ChartContainer
                config={{ pnl: { label: "PnL", color: "#10b981" } }}
                className="h-full w-full"
              >
                <BarChart
                  data={chartsData.setupsData}
                  layout="vertical"
                  margin={{ top: 10, right: 10, left: 30, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    horizontal={false}
                    stroke="hsl(var(--border)/0.3)"
                  />
                  <XAxis
                    type="number"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: 12 }}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="pnl" radius={[0, 2, 2, 0]} barSize={24}>
                    {chartsData.setupsData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.pnl >= 0 ? "#10b981" : "#ef4444"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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
                  <th className="pb-4 font-medium text-muted-foreground/70">
                    Symbol
                  </th>
                  <th className="pb-4 font-medium text-muted-foreground/70">
                    Conditions
                  </th>
                  <th className="pb-4 font-medium text-muted-foreground/70">
                    Side
                  </th>
                  <th className="pb-4 font-medium text-muted-foreground/70">
                    Status
                  </th>
                  <th className="pb-4 font-medium text-muted-foreground/70">
                    Entry
                  </th>
                  <th className="pb-4 font-medium text-muted-foreground/70">
                    Exit
                  </th>
                  <th className="pb-4 font-medium text-muted-foreground/70">
                    PnL
                  </th>
                  <th className="pb-4 font-medium text-muted-foreground/70">
                    Confidence
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/10">
                {trades.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="py-8 text-center text-muted-foreground text-sm"
                    >
                      No positions found. Connect an exchange or wait for trades
                      to sync.
                    </td>
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
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </span>
                              {trade.symbol}
                            </div>
                            {trade.setup && (
                              <div className="pl-6 mt-1.5">
                                <Badge
                                  variant="outline"
                                  style={{
                                    borderColor: trade.setup.color
                                      ? `${trade.setup.color}40`
                                      : undefined,
                                    color: trade.setup.color,
                                  }}
                                  className="text-[9px] px-1.5 py-0 h-4 uppercase tracking-wider bg-transparent"
                                >
                                  {trade.setup.name}
                                </Badge>
                              </div>
                            )}
                          </td>
                          <td className="py-4">
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {trade.conditions?.length > 0 ? (
                                trade.conditions
                                  .slice(0, 3)
                                  .map((c: any) => (
                                    <Badge
                                      key={c.id}
                                      variant="outline"
                                      className="text-[9px] bg-blue-500/5 text-blue-500/80 border-blue-500/20 rounded px-1.5 py-0 h-4"
                                    >
                                      {c.name}
                                    </Badge>
                                  ))
                              ) : (
                                <span className="text-muted-foreground/40 text-xs">
                                  -
                                </span>
                              )}
                              {trade.conditions?.length > 3 && (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] bg-muted/30 text-muted-foreground border-border/40 rounded px-1.5 py-0 h-4"
                                >
                                  +{trade.conditions.length - 3}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="py-4">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] uppercase tracking-wider rounded px-2 font-semibold",
                                trade.side === "long"
                                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                                  : "bg-red-500/10 text-red-500 border-red-500/20"
                              )}
                            >
                              {trade.side}
                            </Badge>
                          </td>
                          <td className="py-4">
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-[10px] uppercase tracking-wider rounded px-2 font-semibold",
                                trade.status === "open"
                                  ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                                  : trade.status === "closed"
                                  ? "bg-muted/30 text-muted-foreground border-border/40"
                                  : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                              )}
                            >
                              {trade.status}
                            </Badge>
                          </td>
                          <td className="py-4 text-sm font-mono">
                            ${trade.entryPrice}
                          </td>
                          <td className="py-4 text-sm font-mono">
                            {trade.exitPrice ? `$${trade.exitPrice}` : "-"}
                          </td>
                          <td
                            className={cn(
                              "py-4 text-sm font-bold",
                              pnlColor(trade.pnl || 0)
                            )}
                          >
                            {trade.pnl ? formatMoney(trade.pnl) : "-"}
                          </td>
                          <td className="py-4 text-sm">
                            {trade.confidenceLevel ||
                            trade.notes ||
                            trade.setupReason ? (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-[10px] rounded px-2 font-semibold",
                                  getConfidenceColor(trade.confidenceLevel)
                                )}
                              >
                                {trade.confidenceLevel || 6}/10
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground/60 text-xs">
                                Empty
                              </span>
                            )}
                          </td>
                        </tr>

                        {/* Expanded details row */}
                        {isExpanded && (
                          <tr className="bg-muted/5 border-b border-border/20">
                            <td
                              colSpan={8}
                              className="py-6 px-10 border-l-2 border-l-blue-500/50"
                            >
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="space-y-6">
                                  <div>
                                    <p className="text-[11px] uppercase text-muted-foreground tracking-wider mb-1.5 font-semibold">
                                      Setup
                                    </p>
                                    <p className="text-sm font-medium">
                                      {trade.setup ? trade.setup.name : "-"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] uppercase text-muted-foreground tracking-wider mb-1.5 font-semibold">
                                      Setup Reason
                                    </p>
                                    <p className="text-sm font-medium">
                                      {trade.setupReason || "-"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] uppercase text-muted-foreground tracking-wider mb-1.5 font-semibold">
                                      Market Conditions
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                      {trade.conditions?.length > 0 ? (
                                        trade.conditions.map((c: any) => (
                                          <Badge
                                            key={c.id}
                                            variant="outline"
                                            className="text-[10px] bg-blue-500/10 text-blue-500 border-blue-500/20"
                                          >
                                            {c.name}
                                          </Badge>
                                        ))
                                      ) : (
                                        <span className="text-sm text-muted-foreground">
                                          -
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-6">
                                  <div>
                                    <p className="text-[11px] uppercase text-muted-foreground tracking-wider mb-1.5 font-semibold">
                                      Psychology
                                    </p>
                                    <p className="text-sm font-medium">
                                      {trade.psychology || "-"}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-[11px] uppercase text-muted-foreground tracking-wider mb-1.5 font-semibold">
                                      Confidence Level
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <div className="flex gap-1.5">
                                        {Array.from({ length: 10 }).map(
                                          (_, i) => (
                                            <div
                                              key={i}
                                              className={cn(
                                                "h-2 w-2 rounded-full",
                                                i <
                                                  (trade.confidenceLevel || 0)
                                                  ? "bg-green-500"
                                                  : "bg-muted-foreground/20"
                                              )}
                                            />
                                          )
                                        )}
                                      </div>
                                      <span className="text-sm text-muted-foreground">
                                        {trade.confidenceLevel || 0}/10
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="space-y-6">
                                  <div>
                                    <p className="text-[11px] uppercase text-muted-foreground tracking-wider mb-1.5 font-semibold">
                                      Notes
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {trade.notes || "No notes available."}
                                    </p>
                                  </div>
                                  <div className="pt-4 flex items-center gap-3">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onOpenChat && onOpenChat(trade);
                                      }}
                                      className="gap-2 h-8 text-xs bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                      {trade.confidenceLevel
                                        ? "AI Journal Entry"
                                        : "Ask AI to Journal"}
                                    </Button>

                                    {trade.status === "closed" && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onOpenChat && onOpenChat(trade);
                                        }}
                                        className="gap-2 h-8 text-xs bg-purple-500/10 text-purple-500 border-purple-500/20 hover:bg-purple-500/20"
                                      >
                                        <CheckSquare className="h-3.5 w-3.5" />
                                        {trade.exitReason
                                          ? "AI Journal Exit"
                                          : "Ask AI to Close"}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {trade.status === "closed" && (
                                <div className="mt-6 pt-6 border-t border-border/40 border-dashed">
                                  <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                    <div>
                                      <p className="text-[11px] uppercase text-muted-foreground tracking-wider mb-1.5 font-semibold">
                                        Exit Reason
                                      </p>
                                      <p className="text-sm font-medium">
                                        {trade.exitReason || "-"}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[11px] uppercase text-muted-foreground tracking-wider mb-1.5 font-semibold">
                                        Exit Emotion
                                      </p>
                                      <p className="text-sm font-medium">
                                        {trade.exitPsychology || "-"}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[11px] uppercase text-muted-foreground tracking-wider mb-1.5 font-semibold">
                                        Mistakes
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {trade.mistakes || "-"}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="text-[11px] uppercase text-muted-foreground tracking-wider mb-1.5 font-semibold">
                                        Lessons
                                      </p>
                                      <p className="text-sm text-muted-foreground">
                                        {trade.lessons || "-"}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
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
            <span>
              Showing {Math.min(trades.length, trades.length)} of{" "}
              {trades.length} positions
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
