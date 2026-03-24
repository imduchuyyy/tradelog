"use client";

import React, { useMemo, useState, useTransition, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import {
  ChevronDown,
  ChevronRight,
  TrendingUp,
  Percent,
  Filter,
  X,
  Clock,
  Activity,
  Zap,
  BookOpen,
  Pencil,
} from "lucide-react";
import { cn, getSessionFromDate } from "@/lib/utils";
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
import { journalTrade } from "@/app/actions";
import { useTranslations } from "next-intl";

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Constants ───────────────────────────────────────────────────────────────

const MARKET_CONDITION_VALUES = ["trending", "range", "50/50", "counter_trend"] as const;
const SESSION_VALUES = ["sydney", "tokyo", "london", "new_york"] as const;

const MC_KEY_MAP: Record<string, string> = {
  trending: "trending",
  range: "range",
  "50/50": "5050",
  counter_trend: "counterTrend",
};

const SESSION_KEY_MAP: Record<string, string> = {
  sydney: "sydney",
  tokyo: "tokyo",
  london: "london",
  new_york: "newYork",
};

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1d", "1w"];

// ─── Types ───────────────────────────────────────────────────────────────────

interface DashboardTabProps {
  trades: any[];
  setups?: any[];
  onOpenChat?: (context: any) => void;
}

interface Filters {
  setup: string;
  marketCondition: string;
  session: string;
  side: string;
  status: string;
  minConfidence: string;
  maxConfidence: string;
  minDiscipline: string;
  maxDiscipline: string;
  minHoldingTime: string;
  maxHoldingTime: string;
  entryTimeframe: string;
  symbol: string;
}

const defaultFilters: Filters = {
  setup: "",
  marketCondition: "",
  session: "",
  side: "",
  status: "",
  minConfidence: "",
  maxConfidence: "",
  minDiscipline: "",
  maxDiscipline: "",
  minHoldingTime: "",
  maxHoldingTime: "",
  entryTimeframe: "",
  symbol: "",
};

// ─── Component ───────────────────────────────────────────────────────────────

export function DashboardTab({ trades, setups = [], onOpenChat }: DashboardTabProps) {
  const tOverview = useTranslations("dashboard.overview");
  const tFilters = useTranslations("dashboard.filters");
  const tTable = useTranslations("dashboard.table");
  const tExpanded = useTranslations("dashboard.expanded");
  const tMC = useTranslations("dashboard.marketConditions");
  const tSess = useTranslations("dashboard.sessions");
  const tc = useTranslations("common");

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [showFilters, setShowFilters] = useState(false);

  const toggleRow = (id: string) => {
    const next = new Set(expandedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedRows(next);
  };

  const setFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => setFilters(defaultFilters);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // ─── Data processing ────────────────────────────────────────────────────

  const { metrics, chartsData, filteredTrades: sortedTrades } = useMemo(() => {
    let filtered = [...trades].map((t) => ({
      ...t,
      pnl: t.pnl ? Number(t.pnl) : 0,
      entryPrice: t.entryPrice ? Number(t.entryPrice) : 0,
      exitPrice: t.exitPrice ? Number(t.exitPrice) : 0,
      mae: t.mae ? Number(t.mae) : null,
      mfe: t.mfe ? Number(t.mfe) : null,
      riskRewardRatio: t.riskRewardRatio ? Number(t.riskRewardRatio) : null,
    }));

    // Apply filters
    if (filters.setup) {
      filtered = filtered.filter((t) =>
        t.setups?.some((s: any) => s.id === filters.setup)
      );
    }
    if (filters.marketCondition) {
      filtered = filtered.filter((t) => t.marketCondition === filters.marketCondition);
    }
    if (filters.session) {
      filtered = filtered.filter((t) => t.session === filters.session);
    }
    if (filters.side) {
      filtered = filtered.filter((t) => t.side === filters.side);
    }
    if (filters.status) {
      filtered = filtered.filter((t) => t.status === filters.status);
    }
    if (filters.minConfidence) {
      filtered = filtered.filter((t) => t.confidenceLevel && t.confidenceLevel >= parseInt(filters.minConfidence));
    }
    if (filters.maxConfidence) {
      filtered = filtered.filter((t) => t.confidenceLevel && t.confidenceLevel <= parseInt(filters.maxConfidence));
    }
    if (filters.minDiscipline) {
      filtered = filtered.filter((t) => t.disciplineLevel && t.disciplineLevel >= parseInt(filters.minDiscipline));
    }
    if (filters.maxDiscipline) {
      filtered = filtered.filter((t) => t.disciplineLevel && t.disciplineLevel <= parseInt(filters.maxDiscipline));
    }
    if (filters.minHoldingTime) {
      filtered = filtered.filter((t) => t.holdingTime && t.holdingTime >= parseInt(filters.minHoldingTime));
    }
    if (filters.maxHoldingTime) {
      filtered = filtered.filter((t) => t.holdingTime && t.holdingTime <= parseInt(filters.maxHoldingTime));
    }
    if (filters.entryTimeframe) {
      filtered = filtered.filter((t) => t.entryTimeframe === filters.entryTimeframe);
    }
    if (filters.symbol) {
      const sym = filters.symbol.toUpperCase();
      filtered = filtered.filter((t) => t.symbol.toUpperCase().includes(sym));
    }

    // Sort chronologically
    const sorted = filtered.sort(
      (a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime()
    );
    const chronological = [...sorted].reverse();

    const closed = chronological.filter((t) => t.status === "closed");
    const open = filtered.filter((t) => t.status === "open");
    const wins = closed.filter((t) => t.pnl > 0);
    const losses = closed.filter((t) => t.pnl <= 0);

    const winRate = closed.length > 0 ? (wins.length / closed.length) * 100 : 0;
    const totalPnl = closed.reduce((sum, t) => sum + t.pnl, 0);
    const bestTrade = closed.reduce((max, t) => Math.max(max, t.pnl), 0);
    const worstTrade = closed.reduce((min, t) => Math.min(min, t.pnl), 0);

    const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + t.pnl, 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? losses.reduce((s, t) => s + t.pnl, 0) / losses.length : 0;
    const riskReward = avgLoss !== 0 ? Math.abs(avgWin / avgLoss) : 0;

    // Profit Factor
    const grossWin = wins.reduce((s, t) => s + t.pnl, 0);
    const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
    const profitFactor = grossLoss !== 0 ? grossWin / grossLoss : 0;

    // Expectancy: (WinRate * AvgWin) - (LossRate * |AvgLoss|)
    const lossRate = closed.length > 0 ? (losses.length / closed.length) : 0;
    const winRateDecimal = closed.length > 0 ? (wins.length / closed.length) : 0;
    const expectancy = (winRateDecimal * avgWin) - (lossRate * Math.abs(avgLoss));

    // Max Drawdown
    let peak = 0;
    let maxDrawdown = 0;
    let runningPnl = 0;
    for (const t of closed) {
      runningPnl += t.pnl;
      if (runningPnl > peak) peak = runningPnl;
      const dd = peak - runningPnl;
      if (dd > maxDrawdown) maxDrawdown = dd;
    }

    // Streaks
    let currentStreak = 0;
    let maxWinStreak = 0;
    let maxLossStreak = 0;
    let tempStreak = 0;
    for (const t of closed) {
      if (t.pnl > 0) {
        tempStreak = tempStreak > 0 ? tempStreak + 1 : 1;
        maxWinStreak = Math.max(maxWinStreak, tempStreak);
      } else {
        tempStreak = tempStreak < 0 ? tempStreak - 1 : -1;
        maxLossStreak = Math.max(maxLossStreak, Math.abs(tempStreak));
      }
      currentStreak = tempStreak;
    }

    // Cumulative PnL chart
    let cumulPnl = 0;
    const cumulative = closed.map((t) => {
      cumulPnl += t.pnl;
      return {
        date: new Date(t.entryDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        pnl: cumulPnl,
      };
    });

    // Win Rate over time chart
    let winCount = 0;
    const winRateData = closed.map((t, i) => {
      if (t.pnl > 0) winCount++;
      return {
        date: new Date(t.entryDate).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        winRate: (winCount / (i + 1)) * 100,
      };
    });

    // Setup performance
    const setupMap = new Map<string, { pnl: number; wins: number; total: number }>();
    closed.forEach((t) => {
      const setupNames = t.setups?.length > 0
        ? t.setups.map((s: any) => s.name)
        : ["No Setup"];
      for (const sName of setupNames) {
        const existing = setupMap.get(sName) || { pnl: 0, wins: 0, total: 0 };
        existing.pnl += t.pnl;
        existing.total++;
        if (t.pnl > 0) existing.wins++;
        setupMap.set(sName, existing);
      }
    });
    const setupsData = Array.from(setupMap.entries())
      .map(([name, stats]) => ({
        name,
        pnl: stats.pnl,
        winRate: (stats.wins / stats.total) * 100,
      }))
      .sort((a, b) => b.pnl - a.pnl)
      .slice(0, 8);

    // Session performance
    const sessionMap = new Map<string, { pnl: number; wins: number; total: number }>();
    closed.forEach((t) => {
      const sess = t.session || "Unknown";
      const existing = sessionMap.get(sess) || { pnl: 0, wins: 0, total: 0 };
      existing.pnl += t.pnl;
      existing.total++;
      if (t.pnl > 0) existing.wins++;
      sessionMap.set(sess, existing);
    });
    const sessionData = Array.from(sessionMap.entries())
      .map(([name, stats]) => ({
        name: SESSION_KEY_MAP[name] ? tSess(SESSION_KEY_MAP[name]) : name,
        pnl: stats.pnl,
        winRate: (stats.wins / stats.total) * 100,
        trades: stats.total,
      }))
      .sort((a, b) => b.pnl - a.pnl);

    return {
      metrics: {
        totalTrades: filtered.length,
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
        expectancy,
        maxDrawdown,
        currentStreak,
        maxWinStreak,
        maxLossStreak,
      },
      chartsData: { cumulative, winRateData, setupsData, sessionData },
      filteredTrades: sorted,
    };
  }, [trades, filters]);

  const pnlColor = (val: number) => (val >= 0 ? "text-success" : "text-destructive");
  const formatMoney = (val: number) => `${val >= 0 ? "+" : "-"}$${Math.abs(val).toFixed(2)}`;

  const formatHoldingTime = (minutes: number | null | undefined) => {
    if (!minutes) return "-";
    if (minutes < 60) return `${minutes}m`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    return `${Math.floor(minutes / 1440)}d ${Math.floor((minutes % 1440) / 60)}h`;
  };

  const getSessionLabel = (val: string | null | undefined) => {
    if (!val) return "-";
    return SESSION_KEY_MAP[val] ? tSess(SESSION_KEY_MAP[val]) : val;
  };

  const getMarketConditionLabel = (val: string | null | undefined) => {
    if (!val) return "-";
    return MC_KEY_MAP[val] ? tMC(MC_KEY_MAP[val]) : val;
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header + Filter Toggle */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h2 className="text-2xl font-bold tracking-tight">{tOverview("title")}</h2>
        <Button
          variant={showFilters ? "default" : "outline"}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2"
        >
          <Filter className="h-3.5 w-3.5" />
          {tOverview("filters")}
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 min-w-5 rounded-full text-[10px] px-1.5">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Power Filters Panel */}
      {showFilters && (
        <Card className="bg-card border-border">
          <CardContent className="pt-5 pb-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
              {/* Symbol */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{tFilters("symbol")}</label>
                <Input
                  value={filters.symbol}
                  onChange={(e) => setFilter("symbol", e.target.value)}
                  placeholder="BTCUSDT..."
                  className="h-8 text-xs"
                />
              </div>

              {/* Setup */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{tFilters("setup")}</label>
                <select
                  value={filters.setup}
                  onChange={(e) => setFilter("setup", e.target.value)}
                  className="flex h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                >
                  <option value="">{tc("all")}</option>
                  {setups.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              {/* Market Condition */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{tFilters("condition")}</label>
                <select
                  value={filters.marketCondition}
                  onChange={(e) => setFilter("marketCondition", e.target.value)}
                  className="flex h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                >
                  <option value="">{tc("all")}</option>
                  {MARKET_CONDITION_VALUES.map((val) => (
                    <option key={val} value={val}>{tMC(MC_KEY_MAP[val])}</option>
                  ))}
                </select>
              </div>

              {/* Session */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{tFilters("session")}</label>
                <select
                  value={filters.session}
                  onChange={(e) => setFilter("session", e.target.value)}
                  className="flex h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                >
                  <option value="">{tc("all")}</option>
                  {SESSION_VALUES.map((val) => (
                    <option key={val} value={val}>{tSess(SESSION_KEY_MAP[val])}</option>
                  ))}
                </select>
              </div>

              {/* Side */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{tFilters("side")}</label>
                <select
                  value={filters.side}
                  onChange={(e) => setFilter("side", e.target.value)}
                  className="flex h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                >
                  <option value="">{tc("all")}</option>
                  <option value="long">Long</option>
                  <option value="short">Short</option>
                </select>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{tFilters("status")}</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilter("status", e.target.value)}
                  className="flex h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                >
                  <option value="">{tc("all")}</option>
                  <option value="open">Open</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Entry Timeframe */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{tFilters("timeframe")}</label>
                <select
                  value={filters.entryTimeframe}
                  onChange={(e) => setFilter("entryTimeframe", e.target.value)}
                  className="flex h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                >
                  <option value="">{tc("all")}</option>
                  {TIMEFRAMES.map((tf) => (
                    <option key={tf} value={tf}>{tf}</option>
                  ))}
                </select>
              </div>

              {/* Confidence Range */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{tFilters("confidence")}</label>
                <div className="flex gap-1">
                  <Input
                    value={filters.minConfidence}
                    onChange={(e) => setFilter("minConfidence", e.target.value)}
                    placeholder={tFilters("min")}
                    type="number"
                    min="1"
                    max="10"
                    className="h-8 text-xs w-1/2"
                  />
                  <Input
                    value={filters.maxConfidence}
                    onChange={(e) => setFilter("maxConfidence", e.target.value)}
                    placeholder={tFilters("max")}
                    type="number"
                    min="1"
                    max="10"
                    className="h-8 text-xs w-1/2"
                  />
                </div>
              </div>

              {/* Discipline Range */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{tFilters("discipline")}</label>
                <div className="flex gap-1">
                  <Input
                    value={filters.minDiscipline}
                    onChange={(e) => setFilter("minDiscipline", e.target.value)}
                    placeholder={tFilters("min")}
                    type="number"
                    min="1"
                    max="10"
                    className="h-8 text-xs w-1/2"
                  />
                  <Input
                    value={filters.maxDiscipline}
                    onChange={(e) => setFilter("maxDiscipline", e.target.value)}
                    placeholder={tFilters("max")}
                    type="number"
                    min="1"
                    max="10"
                    className="h-8 text-xs w-1/2"
                  />
                </div>
              </div>

              {/* Holding Time Range (minutes) */}
              <div className="space-y-1">
                <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">{tFilters("holdMin")}</label>
                <div className="flex gap-1">
                  <Input
                    value={filters.minHoldingTime}
                    onChange={(e) => setFilter("minHoldingTime", e.target.value)}
                    placeholder={tFilters("min")}
                    type="number"
                    className="h-8 text-xs w-1/2"
                  />
                  <Input
                    value={filters.maxHoldingTime}
                    onChange={(e) => setFilter("maxHoldingTime", e.target.value)}
                    placeholder={tFilters("max")}
                    type="number"
                    className="h-8 text-xs w-1/2"
                  />
                </div>
              </div>
            </div>

            {activeFilterCount > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs gap-1.5 text-muted-foreground">
                  <X className="h-3 w-3" />
                  {tOverview("clearAllFilters")}
                </Button>
                <span className="text-xs text-muted-foreground">
                  {tOverview("showingOf", { shown: sortedTrades.length, total: trades.length })}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Top Stats — 8 cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{tOverview("trades")}</p>
            <p className="text-xl font-bold text-foreground mt-1">{metrics.totalTrades}</p>
            <p className="text-[9px] text-muted-foreground">{tOverview("openClosed", { open: metrics.openTrades, closed: metrics.closedTrades })}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{tOverview("winRate")}</p>
            <p className="text-xl font-bold text-success mt-1">{metrics.winRate.toFixed(1)}%</p>
            <p className="text-[9px] text-muted-foreground">{tOverview("winsLosses", { wins: metrics.wins, losses: metrics.losses })}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{tOverview("totalPnl")}</p>
            <p className={cn("text-xl font-bold mt-1", pnlColor(metrics.totalPnl))}>{formatMoney(metrics.totalPnl)}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{tOverview("expectancy")}</p>
            <p className={cn("text-xl font-bold mt-1", pnlColor(metrics.expectancy))}>{formatMoney(metrics.expectancy)}</p>
            <p className="text-[9px] text-muted-foreground">{tOverview("perTrade")}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{tOverview("profitFactor")}</p>
            <p className="text-xl font-bold text-muted-foreground mt-1">{metrics.profitFactor.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{tOverview("maxDrawdown")}</p>
            <p className="text-xl font-bold text-destructive mt-1">-${metrics.maxDrawdown.toFixed(2)}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{tOverview("rrRatio")}</p>
            <p className="text-xl font-bold text-muted-foreground mt-1">{metrics.riskReward.toFixed(2)}x</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-3">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">{tOverview("streak")}</p>
            <p className={cn("text-xl font-bold mt-1", metrics.currentStreak >= 0 ? "text-success" : "text-destructive")}>
              {metrics.currentStreak > 0 ? `+${metrics.currentStreak}` : metrics.currentStreak}
            </p>
            <p className="text-[9px] text-muted-foreground">{tOverview("maxStreaks", { win: metrics.maxWinStreak, loss: metrics.maxLossStreak })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cumulative PnL */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-foreground" />
              {tOverview("cumulativePnl")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            {chartsData.cumulative.length > 1 ? (
              <ChartContainer config={{ pnl: { label: "PnL", color: "#00ffaa" } }} className="h-48 w-full">
                <LineChart data={chartsData.cumulative}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#666666" }} stroke="#333333" />
                  <YAxis tick={{ fontSize: 10, fill: "#666666" }} stroke="#333333" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="pnl" stroke="#00ffaa" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">{tOverview("needAtLeast2")}</div>
            )}
          </CardContent>
        </Card>

        {/* Win Rate Over Time */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Percent className="h-4 w-4 text-success" />
              {tOverview("winRateOverTime")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            {chartsData.winRateData.length > 1 ? (
              <ChartContainer config={{ winRate: { label: "Win Rate %", color: "#00ffaa" } }} className="h-48 w-full">
                <LineChart data={chartsData.winRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#666666" }} stroke="#333333" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#666666" }} stroke="#333333" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="winRate" stroke="#00ffaa" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">{tOverview("needAtLeast2")}</div>
            )}
          </CardContent>
        </Card>

        {/* Setup Performance */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Zap className="h-4 w-4 text-foreground" />
              {tOverview("performanceBySetup")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            {chartsData.setupsData.length > 0 ? (
              <ChartContainer config={{ pnl: { label: "PnL", color: "#ffffff" } }} className="h-48 w-full">
                <BarChart data={chartsData.setupsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#666666" }} stroke="#333333" />
                  <YAxis tick={{ fontSize: 10, fill: "#666666" }} stroke="#333333" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {chartsData.setupsData.map((entry, i) => (
                      <Cell key={i} fill={entry.pnl >= 0 ? "#00ffaa" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">{tOverview("noSetupData")}</div>
            )}
          </CardContent>
        </Card>

        {/* Session Performance */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              {tOverview("performanceBySession")}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-2 pb-3">
            {chartsData.sessionData.length > 0 ? (
              <ChartContainer config={{ pnl: { label: "PnL", color: "#ffffff" } }} className="h-48 w-full">
                <BarChart data={chartsData.sessionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222222" />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#666666" }} stroke="#333333" />
                  <YAxis tick={{ fontSize: 10, fill: "#666666" }} stroke="#333333" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {chartsData.sessionData.map((entry, i) => (
                      <Cell key={i} fill={entry.pnl >= 0 ? "#00ffaa" : "#ef4444"} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-xs text-muted-foreground">{tOverview("noSessionData")}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trades Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Activity className="h-4 w-4 text-foreground" />
            {tOverview("trades")} ({sortedTrades.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border">
                  <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground w-8"></th>
                  <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">{tTable("symbol")}</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">{tTable("side")}</th>
                  <th className="px-3 py-2.5 text-left font-semibold text-muted-foreground">{tTable("status")}</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">{tTable("entry")}</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">{tTable("exit")}</th>
                  <th className="px-3 py-2.5 text-right font-semibold text-muted-foreground">{tTable("pnl")}</th>
                  <th className="px-3 py-2.5 text-center font-semibold text-muted-foreground w-20">{tTable("journal")}</th>
                </tr>
              </thead>
              <tbody>
                {sortedTrades.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-8 text-center text-muted-foreground">
                      {activeFilterCount > 0 ? tTable("noTradesMatchingFilters") : tTable("noTradesFound")}{activeFilterCount === 0 ? ` ${tTable("syncToGetStarted")}` : ""}
                    </td>
                  </tr>
                ) : (
                  sortedTrades.map((t: any) => (
                    <React.Fragment key={t.id}>
                      <tr
                        className={cn(
                          "border-b border-border hover:bg-muted cursor-pointer transition-colors",
                          t.isNew && "bg-muted border-l-2 border-l-success"
                        )}
                        onClick={() => toggleRow(t.id)}
                      >
                        <td className="px-3 py-2.5">
                          {expandedRows.has(t.id) ? (
                            <ChevronDown className="h-3 w-3 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          )}
                        </td>
                        <td className="px-3 py-2.5 font-medium">
                          <div className="flex items-center gap-2">
                            {t.symbol}
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(t.entryDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline" className={cn("text-[10px]", t.side === "long" ? "text-success border-success/30" : "text-destructive border-destructive/30")}>
                            {t.side?.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant="outline" className={cn("text-[10px]", t.status === "open" ? "text-foreground border-border" : "text-muted-foreground")}>
                            {t.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-right font-mono">${t.entryPrice.toFixed(2)}</td>
                        <td className="px-3 py-2.5 text-right font-mono">{t.exitPrice ? `$${t.exitPrice.toFixed(2)}` : "-"}</td>
                        <td className={cn("px-3 py-2.5 text-right font-mono font-semibold", pnlColor(t.pnl))}>{t.pnl ? formatMoney(t.pnl) : "-"}</td>
                        <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                          <TradeJournalDialog trade={t} setups={setups}>
                            {t.needsJournal || t.isNew ? (
                              <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-500 cursor-pointer hover:bg-amber-500/10 gap-1">
                                <BookOpen className="h-3 w-3" />
                                {tTable("add")}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] border-border text-muted-foreground cursor-pointer hover:bg-muted gap-1">
                                <Pencil className="h-3 w-3" />
                                {tTable("editJournal")}
                              </Badge>
                            )}
                          </TradeJournalDialog>
                        </td>
                      </tr>

                      {/* Expanded row */}
                      {expandedRows.has(t.id) && (
                        <tr className="bg-muted">
                          <td colSpan={8} className="px-6 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 text-xs">
                              {/* Moved from main row */}
                              <div>
                                <p className="text-muted-foreground font-medium mb-1">{tExpanded("condition")}</p>
                                <p>{getMarketConditionLabel(t.marketCondition)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-medium mb-1">{tExpanded("session")}</p>
                                <p>{getSessionLabel(t.session)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-medium mb-1">{tExpanded("rr")}</p>
                                <p>{t.riskRewardRatio ? `${t.riskRewardRatio.toFixed(1)}` : "-"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-medium mb-1">{tExpanded("confidence")}</p>
                                <p>{t.confidenceLevel ? `${t.confidenceLevel}/10` : "-"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-medium mb-1">{tExpanded("discipline")}</p>
                                <p>{t.disciplineLevel ? `${t.disciplineLevel}/10` : "-"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-medium mb-1">{tExpanded("holdingTime")}</p>
                                <p>{formatHoldingTime(t.holdingTime)}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-medium mb-1">{tExpanded("date")}</p>
                                <p>{new Date(t.entryDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "2-digit" })}</p>
                              </div>
                            </div>

                            {/* Second row: existing expanded data */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mt-4 pt-4 border-t border-border">
                              <div>
                                <p className="text-muted-foreground font-medium mb-1">{tExpanded("setups")}</p>
                                <div className="flex flex-wrap gap-1">
                                  {t.setups?.length > 0
                                    ? t.setups.map((s: any) => (
                                        <Badge key={s.id} variant="outline" className="text-[10px]" style={{ borderColor: s.color }}>
                                          {s.name}
                                        </Badge>
                                      ))
                                    : <span className="text-muted-foreground">{tc("none")}</span>
                                  }
                                </div>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-medium mb-1">{tExpanded("timeframe")}</p>
                                <p>{t.entryTimeframe || "-"}</p>
                              </div>
                              <div>
                                <p className="text-muted-foreground font-medium mb-1">{tExpanded("maeMfe")}</p>
                                <p>
                                  {t.mae !== null ? <span className="text-destructive">${t.mae.toFixed(2)}</span> : "-"}
                                  {" / "}
                                  {t.mfe !== null ? <span className="text-success">${t.mfe.toFixed(2)}</span> : "-"}
                                </p>
                              </div>
                              {t.exitReason && (
                                <div className="col-span-2">
                                  <p className="text-muted-foreground font-medium mb-1">{tExpanded("exitReason")}</p>
                                  <p className="text-foreground">{t.exitReason}</p>
                                </div>
                              )}
                              {t.lessons && (
                                <div className="col-span-2">
                                  <p className="text-muted-foreground font-medium mb-1">{tExpanded("lessons")}</p>
                                  <p className="text-foreground">{t.lessons}</p>
                                </div>
                              )}
                              {t.notes && (
                                <div className="col-span-2">
                                  <p className="text-muted-foreground font-medium mb-1">{tExpanded("notes")}</p>
                                  <p className="text-foreground">{t.notes}</p>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Trade Journal Dialog ────────────────────────────────────────────────────

function TradeJournalDialog({
  trade,
  setups,
  children,
}: {
  trade: any;
  setups: any[];
  children: React.ReactNode;
}) {
  const tJournal = useTranslations("dashboard.journal");
  const tMC = useTranslations("dashboard.marketConditions");
  const tSess = useTranslations("dashboard.sessions");
  const tc = useTranslations("common");

  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // ── Setup multi-select state ──
  const [selectedSetupIds, setSelectedSetupIds] = useState<string[]>(
    () => trade.setups?.map((s: any) => s.id) || []
  );
  const [newSetupNames, setNewSetupNames] = useState<string[]>([]);
  const [setupDropdownOpen, setSetupDropdownOpen] = useState(false);
  const [setupSearch, setSetupSearch] = useState("");
  const setupDropdownRef = useRef<HTMLDivElement>(null);
  const setupInputRef = useRef<HTMLInputElement>(null);

  // ── Other form state ──
  const [marketCondition, setMarketCondition] = useState(trade.marketCondition || "");
  const [session, setSession] = useState(
    trade.session || (trade.entryDate ? getSessionFromDate(new Date(trade.entryDate)) : "")
  );
  const [entryTimeframe, setEntryTimeframe] = useState(trade.entryTimeframe || "");
  const [riskRewardRatio, setRiskRewardRatio] = useState(
    trade.riskRewardRatio != null ? String(trade.riskRewardRatio) : ""
  );
  const [confidenceLevel, setConfidenceLevel] = useState(
    trade.confidenceLevel != null ? trade.confidenceLevel : 5
  );
  const [disciplineLevel, setDisciplineLevel] = useState(
    trade.disciplineLevel != null ? trade.disciplineLevel : 5
  );
  const [exitReason, setExitReason] = useState(trade.exitReason || "");
  const [lessons, setLessons] = useState(trade.lessons || "");
  const [notes, setNotes] = useState(trade.notes || "");
  const [mae, setMae] = useState(trade.mae != null ? String(trade.mae) : "");
  const [mfe, setMfe] = useState(trade.mfe != null ? String(trade.mfe) : "");

  // Auto-computed holding time (display only)
  const holdingTimeDisplay = useMemo(() => {
    if (trade.holdingTime) {
      const m = trade.holdingTime;
      if (m < 60) return `${m}m`;
      if (m < 1440) return `${Math.floor(m / 60)}h ${m % 60}m`;
      return `${Math.floor(m / 1440)}d ${Math.floor((m % 1440) / 60)}h`;
    }
    if (trade.entryDate && trade.exitDate) {
      const mins = Math.round(
        (new Date(trade.exitDate).getTime() - new Date(trade.entryDate).getTime()) / (1000 * 60)
      );
      if (mins < 60) return `${mins}m`;
      if (mins < 1440) return `${Math.floor(mins / 60)}h ${mins % 60}m`;
      return `${Math.floor(mins / 1440)}d ${Math.floor((mins % 1440) / 60)}h`;
    }
    return null;
  }, [trade.holdingTime, trade.entryDate, trade.exitDate]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!setupDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (setupDropdownRef.current && !setupDropdownRef.current.contains(e.target as Node)) {
        setSetupDropdownOpen(false);
        setSetupSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [setupDropdownOpen]);

  // Reset form when dialog opens
  const handleOpenChange = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setSelectedSetupIds(trade.setups?.map((s: any) => s.id) || []);
        setNewSetupNames([]);
        setSetupSearch("");
        setSetupDropdownOpen(false);
        setMarketCondition(trade.marketCondition || "");
        setSession(trade.session || (trade.entryDate ? getSessionFromDate(new Date(trade.entryDate)) : ""));
        setEntryTimeframe(trade.entryTimeframe || "");
        setRiskRewardRatio(trade.riskRewardRatio != null ? String(trade.riskRewardRatio) : "");
        setConfidenceLevel(trade.confidenceLevel != null ? trade.confidenceLevel : 5);
        setDisciplineLevel(trade.disciplineLevel != null ? trade.disciplineLevel : 5);
        setExitReason(trade.exitReason || "");
        setLessons(trade.lessons || "");
        setNotes(trade.notes || "");
        setMae(trade.mae != null ? String(trade.mae) : "");
        setMfe(trade.mfe != null ? String(trade.mfe) : "");
      }
      setOpen(isOpen);
    },
    [trade]
  );

  // ── Setup helpers ──
  const filteredSetups = useMemo(() => {
    if (!setupSearch.trim()) return setups;
    const q = setupSearch.toLowerCase();
    return setups.filter((s: any) => s.name.toLowerCase().includes(q));
  }, [setups, setupSearch]);

  const hasExactMatch = useMemo(() => {
    if (!setupSearch.trim()) return true; // no search = don't show create
    const q = setupSearch.trim().toLowerCase();
    return setups.some((s: any) => s.name.toLowerCase() === q)
      || newSetupNames.some((n) => n.toLowerCase() === q);
  }, [setups, newSetupNames, setupSearch]);

  const toggleExistingSetup = (id: string) => {
    setSelectedSetupIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const removeNewSetup = (name: string) => {
    setNewSetupNames((prev) => prev.filter((n) => n !== name));
  };

  const handleCreateNew = () => {
    const name = setupSearch.trim();
    if (!name || hasExactMatch) return;
    setNewSetupNames((prev) => [...prev, name]);
    setSetupSearch("");
  };

  // Count total selected
  const selectedSetupObjects = useMemo(
    () => setups.filter((s: any) => selectedSetupIds.includes(s.id)),
    [setups, selectedSetupIds]
  );
  const totalSelected = selectedSetupObjects.length + newSetupNames.length;

  const handleSave = () => {
    startTransition(async () => {
      await journalTrade({
        tradeId: trade.id,
        setupIds: selectedSetupIds,
        newSetupNames,
        confidenceLevel: confidenceLevel,
        disciplineLevel: disciplineLevel,
        marketCondition: marketCondition || null,
        session: session || null,
        entryTimeframe: entryTimeframe || null,
        riskRewardRatio: riskRewardRatio ? parseFloat(riskRewardRatio) : null,
        notes: notes || null,
        exitReason: exitReason || null,
        lessons: lessons || null,
        mae: mae ? parseFloat(mae) : null,
        mfe: mfe ? parseFloat(mfe) : null,
      });
      setOpen(false);
    });
  };

  const isNewJournal = trade.needsJournal || trade.isNew;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<span className="inline-flex" />}>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isNewJournal ? tJournal("journalTrade") : tJournal("editJournal")} — {trade.symbol}{" "}
            <Badge
              variant="outline"
              className={cn(
                "text-[10px] ml-1",
                trade.side === "long"
                  ? "text-success border-success/30"
                  : "text-destructive border-destructive/30"
              )}
            >
              {trade.side?.toUpperCase()}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            {isNewJournal
              ? tJournal("addDetails")
              : tJournal("updateDetails")}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-2">
          {/* ── Section 1: Entry Journaling ── */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-1.5">
              {tJournal("entryJournaling")}
            </h4>

            {/* Setups — multi-select dropdown */}
            <div className="space-y-1.5">
              <Label className="text-xs">{tJournal("setups")}</Label>
              <div className="relative" ref={setupDropdownRef}>
                {/* Trigger */}
                <button
                  type="button"
                  onClick={() => {
                    setSetupDropdownOpen((v) => !v);
                    if (!setupDropdownOpen) {
                      setTimeout(() => setupInputRef.current?.focus(), 0);
                    }
                  }}
                  className={cn(
                    "flex min-h-[32px] w-full items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1 text-xs text-left transition-colors",
                    setupDropdownOpen && "ring-1 ring-ring border-ring"
                  )}
                >
                  {totalSelected === 0 ? (
                    <span className="text-muted-foreground">{tJournal("selectSetups")}</span>
                  ) : (
                    <span className="flex flex-wrap gap-1 flex-1">
                      {selectedSetupObjects.map((s: any) => (
                        <span
                          key={s.id}
                          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium"
                          style={{ backgroundColor: `${s.color}20`, color: s.color }}
                        >
                          {s.name}
                          <X
                            className="h-2.5 w-2.5 cursor-pointer opacity-60 hover:opacity-100"
                            onClick={(e) => { e.stopPropagation(); toggleExistingSetup(s.id); }}
                          />
                        </span>
                      ))}
                      {newSetupNames.map((name) => (
                        <span
                          key={`new-${name}`}
                          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-medium bg-primary/15 text-foreground"
                        >
                          {name}
                          <X
                            className="h-2.5 w-2.5 cursor-pointer opacity-60 hover:opacity-100"
                            onClick={(e) => { e.stopPropagation(); removeNewSetup(name); }}
                          />
                        </span>
                      ))}
                    </span>
                  )}
                  <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform", setupDropdownOpen && "rotate-180")} />
                </button>

                {/* Dropdown */}
                {setupDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-[6px] border border-border bg-background">
                    {/* Search input */}
                    <div className="p-1.5 border-b border-border">
                      <input
                        ref={setupInputRef}
                        type="text"
                        value={setupSearch}
                        onChange={(e) => setSetupSearch(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") { e.preventDefault(); handleCreateNew(); }
                          if (e.key === "Escape") { setSetupDropdownOpen(false); setSetupSearch(""); }
                        }}
                        placeholder={tJournal("searchOrCreate")}
                        className="w-full rounded border-0 bg-muted px-2.5 py-1.5 text-xs outline-none placeholder:text-muted-foreground"
                      />
                    </div>

                    {/* Options list */}
                    <div className="max-h-[200px] overflow-y-auto py-1">
                      {filteredSetups.map((s: any) => {
                        const checked = selectedSetupIds.includes(s.id);
                        return (
                          <div
                            key={s.id}
                            onClick={() => toggleExistingSetup(s.id)}
                            className="flex items-center gap-2 px-2.5 py-1.5 text-xs cursor-pointer hover:bg-muted transition-colors"
                          >
                            <div className={cn(
                              "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border",
                              checked ? "border-primary bg-primary" : "border-muted-foreground/40"
                            )}>
                              {checked && (
                                <svg className="h-2.5 w-2.5 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                            <span>{s.name}</span>
                          </div>
                        );
                      })}

                      {/* Already-added new setups (shown as checked, non-removable from list) */}
                      {newSetupNames.map((name) => (
                        <div
                          key={`new-${name}`}
                          className="flex items-center gap-2 px-2.5 py-1.5 text-xs text-foreground"
                        >
                          <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border border-primary bg-primary">
                            <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <span>{name}</span>
                          <span className="text-[10px] text-muted-foreground ml-auto">{tc("new")}</span>
                        </div>
                      ))}

                      {/* Create new option */}
                      {setupSearch.trim() && !hasExactMatch && (
                        <div
                          onClick={handleCreateNew}
                          className="flex items-center gap-2 px-2.5 py-1.5 text-xs cursor-pointer hover:bg-muted transition-colors border-t border-border text-foreground"
                        >
                          <div className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-[3px] border border-primary/40">
                            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                            </svg>
                          </div>
                          <span>{tJournal("create")} <strong>&quot;{setupSearch.trim()}&quot;</strong></span>
                        </div>
                      )}

                      {/* Empty */}
                      {filteredSetups.length === 0 && newSetupNames.length === 0 && !setupSearch.trim() && (
                        <div className="px-2.5 py-4 text-center text-xs text-muted-foreground">
                          {tJournal("noSetupsYet")}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Row: Market Condition, Session, Timeframe */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{tJournal("marketCondition")}</Label>
                <select
                  value={marketCondition}
                  onChange={(e) => setMarketCondition(e.target.value)}
                  className="flex h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                >
                  <option value="">{tc("select")}</option>
                  {MARKET_CONDITION_VALUES.map((val) => (
                    <option key={val} value={val}>
                      {tMC(MC_KEY_MAP[val])}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{tJournal("session")}</Label>
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  className="flex h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                >
                  <option value="">{tc("select")}</option>
                  {SESSION_VALUES.map((val) => (
                    <option key={val} value={val}>
                      {tSess(SESSION_KEY_MAP[val])}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{tJournal("entryTimeframe")}</Label>
                <select
                  value={entryTimeframe}
                  onChange={(e) => setEntryTimeframe(e.target.value)}
                  className="flex h-8 w-full rounded-md border border-border bg-background px-2 text-xs"
                >
                  <option value="">{tc("select")}</option>
                  {TIMEFRAMES.map((tf) => (
                    <option key={tf} value={tf}>
                      {tf}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row: R:R + Confidence Slider */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">{tJournal("riskRewardRatio")}</Label>
                <Input
                  value={riskRewardRatio}
                  onChange={(e) => setRiskRewardRatio(e.target.value)}
                  placeholder="e.g. 2.5"
                  type="number"
                  step="0.1"
                  min="0"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  {tJournal("confidence")} — <span className="text-foreground font-semibold">{confidenceLevel}/10</span>
                </Label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={confidenceLevel}
                  onChange={(e) => setConfidenceLevel(parseInt(e.target.value))}
                  className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <div className="flex justify-between text-[9px] text-muted-foreground">
                  <span>0</span>
                  <span>5</span>
                  <span>10</span>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs">{tJournal("notes")}</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={tJournal("notesPlaceholder")}
                className="text-xs min-h-12"
              />
            </div>
          </div>

          {/* ── Section 2: Post Trade ── */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider border-b border-border pb-1.5">
              {tJournal("postTrade")}
            </h4>

            {/* Holding Time (auto-computed, display only) */}
            {holdingTimeDisplay && (
              <div className="flex items-center gap-2 text-xs bg-muted rounded-md px-3 py-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{tJournal("holdingTime")}</span>
                <span className="font-medium">{holdingTimeDisplay}</span>
                <span className="text-[10px] text-muted-foreground">{tJournal("autoCalculated")}</span>
              </div>
            )}

            {/* Exit Reason */}
            <div className="space-y-1.5">
              <Label className="text-xs">{tJournal("exitReason")}</Label>
              <Textarea
                value={exitReason}
                onChange={(e) => setExitReason(e.target.value)}
                placeholder={tJournal("exitReasonPlaceholder")}
                className="text-xs min-h-12"
              />
            </div>

            {/* Lessons */}
            <div className="space-y-1.5">
              <Label className="text-xs">{tJournal("lessons")}</Label>
              <Textarea
                value={lessons}
                onChange={(e) => setLessons(e.target.value)}
                placeholder={tJournal("lessonsPlaceholder")}
                className="text-xs min-h-12"
              />
            </div>

            {/* Discipline Slider */}
            <div className="space-y-1.5">
              <Label className="text-xs">
                {tJournal("discipline")} — <span className="text-foreground font-semibold">{disciplineLevel}/10</span>
              </Label>
              <input
                type="range"
                min={0}
                max={10}
                step={1}
                value={disciplineLevel}
                onChange={(e) => setDisciplineLevel(parseInt(e.target.value))}
                className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>0</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>

            {/* MAE / MFE */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">
                  {tJournal("mae")} <span className="text-muted-foreground font-normal">({tJournal("maeDesc")})</span>
                </Label>
                <Input
                  value={mae}
                  onChange={(e) => setMae(e.target.value)}
                  placeholder="e.g. 50.00"
                  type="number"
                  step="0.01"
                  min="0"
                  className="h-8 text-xs"
                />
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {tJournal("maeTip")}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">
                  {tJournal("mfe")} <span className="text-muted-foreground font-normal">({tJournal("mfeDesc")})</span>
                </Label>
                <Input
                  value={mfe}
                  onChange={(e) => setMfe(e.target.value)}
                  placeholder="e.g. 120.00"
                  type="number"
                  step="0.01"
                  min="0"
                  className="h-8 text-xs"
                />
                <p className="text-[10px] text-muted-foreground leading-tight">
                  {tJournal("mfeTip")}
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" size="sm" />}>
            {tc("cancel")}
          </DialogClose>
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? tc("saving") : tJournal("saveJournal")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
