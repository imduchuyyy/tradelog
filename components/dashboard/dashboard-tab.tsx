"use client";

import { useMemo, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Plus, SlidersHorizontal, Tags, Trash2, X } from "lucide-react";
import { format, subDays } from "date-fns";
import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DynamicBlockNoteNoteEditor } from "@/components/dashboard/dynamic-blocknote-note-editor";
import { createTrade, deleteTrade, updateTrade } from "@/app/actions";
import {
  type BlockNoteDocument,
  type PastedBlockNoteImage,
  emptyBlockNoteDocument,
  isEmptyBlockNoteDocument,
  parseBlockNoteDocument,
  replacePastedImageUrls,
} from "@/lib/blocknote-note";
import { normalizeSetupTag, parseSetupTags, serializeSetupTags } from "@/lib/trade-setup";
import { getTradeResult, type Trade } from "@/lib/trade";
import { cn } from "@/lib/utils";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";

interface DashboardTabProps {
  trades: Trade[];
}

export function DashboardTab({ trades }: DashboardTabProps) {
  const t = useTranslations("dashboard.manualJournal");
  const defaultEndDate = useMemo(() => formatDateInput(new Date()), []);
  const defaultStartDate = useMemo(() => formatDateInput(subDays(new Date(), 30)), []);
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>([]);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [selectedSetups, setSelectedSetups] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);

  const allSortedTrades = useMemo(
    () => [...trades].sort((a, b) => new Date(b.tradeDate).getTime() - new Date(a.tradeDate).getTime()),
    [trades]
  );
  const symbolOptions = useMemo(
    () => Array.from(new Set(allSortedTrades.map((trade) => trade.symbol.trim().toUpperCase()).filter(Boolean))).sort(),
    [allSortedTrades]
  );
  const setupOptions = useMemo(
    () => Array.from(new Set(allSortedTrades.flatMap((trade) => parseSetupTags(trade.setup)))).sort((a, b) => a.localeCompare(b)),
    [allSortedTrades]
  );
  const sessionOptions = useMemo(
    () => Array.from(new Set(allSortedTrades.map((trade) => trade.session).filter(Boolean) as string[])).sort(),
    [allSortedTrades]
  );
  const sortedTrades = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
    const end = endDate ? new Date(`${endDate}T23:59:59.999`) : null;

    return allSortedTrades.filter((trade) => {
      const tradeDate = new Date(trade.tradeDate);
      const tradeSetups = parseSetupTags(trade.setup);

      if (start && tradeDate < start) return false;
      if (end && tradeDate > end) return false;
      if (selectedSymbols.length > 0 && !selectedSymbols.includes(trade.symbol.trim().toUpperCase())) return false;
      if (selectedSessions.length > 0 && (!trade.session || !selectedSessions.includes(trade.session))) return false;
      if (selectedSetups.length > 0 && !selectedSetups.some((setup) => tradeSetups.includes(setup))) return false;

      return true;
    });
  }, [allSortedTrades, endDate, selectedSessions, selectedSetups, selectedSymbols, startDate]);

  const ENTRIES_PER_PAGE = 10;
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(sortedTrades.length / ENTRIES_PER_PAGE));

  const filterSignature = [selectedSymbols, selectedSessions, selectedSetups, startDate, endDate]
    .map((value) => JSON.stringify(value))
    .join("|");
  const [lastFilterSignature, setLastFilterSignature] = useState(filterSignature);
  if (filterSignature !== lastFilterSignature) {
    setLastFilterSignature(filterSignature);
    setPage(1);
  }

  const currentPage = Math.min(page, totalPages);
  const paginatedTrades = useMemo(
    () => sortedTrades.slice((currentPage - 1) * ENTRIES_PER_PAGE, currentPage * ENTRIES_PER_PAGE),
    [sortedTrades, currentPage]
  );

  const stats = useMemo(() => {
    const total = sortedTrades.reduce((sum, trade) => sum + getTradeResult(trade), 0);
    const wins = sortedTrades.filter((trade) => getTradeResult(trade) > 0).length;
    const losses = sortedTrades.filter((trade) => getTradeResult(trade) < 0).length;
    const winRate = sortedTrades.length ? (wins / sortedTrades.length) * 100 : 0;
    const best = sortedTrades.reduce((max, trade) => Math.max(max, getTradeResult(trade)), 0);
    const worst = sortedTrades.reduce((min, trade) => Math.min(min, getTradeResult(trade)), 0);
    const grossProfit = sortedTrades.reduce((sum, trade) => {
      const result = getTradeResult(trade);
      return result > 0 ? sum + result : sum;
    }, 0);
    const grossLoss = Math.abs(
      sortedTrades.reduce((sum, trade) => {
        const result = getTradeResult(trade);
        return result < 0 ? sum + result : sum;
      }, 0)
    );
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0;
    const avgWin = wins > 0 ? grossProfit / wins : 0;
    const avgLoss = losses > 0 ? grossLoss / losses : 0;
    const winRateFraction = sortedTrades.length ? wins / sortedTrades.length : 0;
    const lossRateFraction = sortedTrades.length ? losses / sortedTrades.length : 0;
    const expectancy = winRateFraction * avgWin - lossRateFraction * avgLoss;

    return { total, wins, losses, winRate, best, worst, profitFactor, avgWin, avgLoss, expectancy };
  }, [sortedTrades]);
  const chartData = useMemo(() => buildChartData(sortedTrades), [sortedTrades]);
  const drawdownStats = useMemo(() => computeDrawdownStats(chartData), [chartData]);
  const consistencyScore = useMemo(() => computeConsistencyScore(chartData), [chartData]);
  const recoveryFactor =
    drawdownStats.maxDrawdown > 0 ? stats.total / drawdownStats.maxDrawdown : stats.total > 0 ? Infinity : 0;
  const pnlChartConfig = useMemo(
    () => ({ cumulativePnl: { label: t("cumulativePnl"), color: "var(--success)" } }) satisfies ChartConfig,
    [t]
  );
  const dailyPnlChartConfig = useMemo(
    () => ({ dailyPnl: { label: t("dailyPnl"), color: "var(--foreground)" } }) satisfies ChartConfig,
    [t]
  );
  const winRateChartConfig = useMemo(
    () => ({ winRate: { label: t("winRatePercent"), color: "var(--success)" } }) satisfies ChartConfig,
    [t]
  );

  const formatMoney = (value: number) => `${value >= 0 ? "+" : "-"}$${Math.abs(value).toFixed(2)}`;
  const moneyColor = (value: number) => value >= 0 ? "text-success" : "text-destructive";
  const formatProfitFactor = (value: number) => Number.isFinite(value) ? value.toFixed(2) : "∞";
  const formatRatio = (value: number) => Number.isFinite(value) ? `${value.toFixed(2)}x` : "∞";

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <TradeDialog title={t("addJournalEntry")} symbolOptions={symbolOptions} setupOptions={setupOptions}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t("addEntry")}
          </Button>
        </TradeDialog>
      </div>

      {allSortedTrades.length === 0 ? (
        <FirstRunEmptyState symbolOptions={symbolOptions} setupOptions={setupOptions} />
      ) : (
        <>
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">{t("filters")}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <FilterMenu label={t("symbols")} options={symbolOptions} selected={selectedSymbols} onChange={setSelectedSymbols} formatOption={(option) => `#${option}`} />
          <FilterMenu label={t("sessions")} options={sessionOptions} selected={selectedSessions} onChange={setSelectedSessions} formatOption={formatSession} />
          <FilterMenu label={t("setups")} options={setupOptions} selected={selectedSetups} onChange={setSelectedSetups} />
          <div className="space-y-2">
            <Label>{t("dateRange")}</Label>
            {(() => {
              const presets = [
                { label: t("preset1w"), days: 7 },
                { label: t("preset1m"), days: 30 },
                { label: t("preset3m"), days: 90 },
              ];
              const activePreset = presets.find(
                (preset) => startDate === formatDateInput(subDays(new Date(), preset.days)) && endDate === formatDateInput(new Date())
              );
              const activeLabel = activePreset ? activePreset.label : t("presetAllTime");

              return (
                <DropdownMenu>
                  <DropdownMenuTrigger render={<Button type="button" variant="outline" className="w-full justify-between font-normal" />}>
                    {activeLabel}
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {presets.map((preset) => (
                      <DropdownMenuItem
                        key={preset.label}
                        onClick={() => {
                          setStartDate(formatDateInput(subDays(new Date(), preset.days)));
                          setEndDate(formatDateInput(new Date()));
                        }}
                      >
                        {preset.label}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem
                      onClick={() => {
                        setStartDate("");
                        setEndDate("");
                      }}
                    >
                      {t("presetAllTime")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })()}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label={t("totalPnl")} value={formatMoney(stats.total)} className={moneyColor(stats.total)} tone={stats.total >= 0 ? "success" : "danger"} />
        <StatCard label={t("entries")} value={String(sortedTrades.length)} tone="neutral" />
        <StatCard label={t("winRate")} value={`${stats.winRate.toFixed(1)}%`} helper={t("winsLosses", { wins: stats.wins, losses: stats.losses })} tone={stats.winRate >= 50 ? "success" : "danger"} />
        <StatCard label={t("profitFactor")} value={formatProfitFactor(stats.profitFactor)} helper={t("profitFactorHelper")} tone={stats.profitFactor >= 1 ? "success" : "danger"} />
        <StatCard
          label={t("bestWorst")}
          value={
            <span className="inline-flex flex-wrap gap-1.5">
              <span className="text-success">{formatMoney(stats.best)}</span>
              <span className="text-muted-foreground">/</span>
              <span className="text-destructive">{formatMoney(stats.worst)}</span>
            </span>
          }
          tone="mixed"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("maxDrawdown")}
          value={formatMoney(-drawdownStats.maxDrawdown)}
          helper={t("maxDrawdownHelper", { days: drawdownStats.maxDurationDays })}
          className="text-destructive"
          tone={drawdownStats.maxDrawdown > 0 ? "danger" : "neutral"}
        />
        <StatCard
          label={t("consistencyScore")}
          value={`${consistencyScore.toFixed(0)}%`}
          helper={t("consistencyScoreHelper")}
          tone={consistencyScore >= 70 ? "success" : consistencyScore >= 40 ? "neutral" : "danger"}
        />
        <StatCard
          label={t("expectancy")}
          value={formatMoney(stats.expectancy)}
          helper={t("expectancyHelper")}
          className={moneyColor(stats.expectancy)}
          tone={stats.expectancy >= 0 ? "success" : "danger"}
        />
        <StatCard
          label={t("recoveryFactor")}
          value={formatRatio(recoveryFactor)}
          helper={t("recoveryFactorHelper")}
          tone={recoveryFactor >= 5 ? "success" : recoveryFactor >= 2 ? "neutral" : "danger"}
        />
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">{t("pnlCurve")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={pnlChartConfig} className="h-72 w-full aspect-auto">
              <AreaChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} width={48} />
                <ReferenceLine y={0} stroke="var(--border)" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="cumulativePnl" stroke="var(--color-cumulativePnl)" fill="var(--color-cumulativePnl)" fillOpacity={0.18} strokeWidth={2} />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader>
            <CardTitle className="text-base">{t("dailyPnl")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={dailyPnlChartConfig} className="h-72 w-full aspect-auto">
              <BarChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} width={48} />
                <ReferenceLine y={0} stroke="var(--border)" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="dailyPnl" radius={[4, 4, 0, 0]}>
                  {chartData.map((item) => (
                    <Cell key={item.date} fill={item.dailyPnl >= 0 ? "var(--success)" : "var(--destructive)"} />
                  ))}
                </Bar>
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="border-border bg-card lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">{t("winRateTrend")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={winRateChartConfig} className="h-72 w-full aspect-auto">
              <LineChart data={chartData} margin={{ left: 8, right: 8, top: 8, bottom: 0 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="winRate" stroke="var(--color-winRate)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base">{t("journalEntries")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedTrades.length === 0 ? (
            <div className="rounded-md border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              {t("noFilteredEntries")}
            </div>
          ) : (
            paginatedTrades.map((trade) => {
              const result = Number(trade.result);
              return (
                <TradeDialog key={trade.id} title={t("editJournalEntry")} trade={trade} symbolOptions={symbolOptions} setupOptions={setupOptions} triggerClassName="block">
                  <div className="rounded-md border border-border bg-background p-4 transition-colors hover:border-ring/60 hover:bg-muted/20">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">#{trade.symbol}</Badge>
                          <span className="text-xs text-muted-foreground">
                            {new Date(trade.tradeDate).toLocaleString()}
                          </span>
                          {trade.session && <Badge variant="outline">{formatSession(trade.session)}</Badge>}
                          {parseSetupTags(trade.setup).map((setup) => (
                            <Badge key={setup} variant="secondary">{setup}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 sm:justify-end">
                        <p className={cn("font-mono text-lg font-bold", moneyColor(result))}>{formatMoney(result)}</p>
                        <DeleteTradeDialog tradeId={trade.id} symbol={trade.symbol} />
                      </div>
                    </div>
                  </div>
                </TradeDialog>
              );
            })
          )}

          {sortedTrades.length > 0 && totalPages > 1 && (
            <div className="flex items-center justify-between pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={currentPage <= 1}
                onClick={() => setPage(Math.max(1, currentPage - 1))}
              >
                <ChevronLeft className="h-4 w-4" />
                {t("previousPage")}
              </Button>
              <p className="text-xs text-muted-foreground">{t("pageOf", { current: currentPage, total: totalPages })}</p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                disabled={currentPage >= totalPages}
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
              >
                {t("nextPage")}
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
        </>
      )}
    </div>
  );
}

function DeleteTradeDialog({ tradeId, symbol }: { tradeId: string; symbol: string }) {
  const t = useTranslations("dashboard.manualJournal");

  return (
    <Dialog>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={(event) => event.stopPropagation()}
          />
        }
      >
        <Trash2 className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent onClick={(event) => event.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>{t("deleteConfirmTitle")}</DialogTitle>
          <DialogDescription>{t("deleteConfirmDescription", { symbol })}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button type="button" variant="outline" />}>
            {t("cancelDelete")}
          </DialogClose>
          <form action={deleteTrade.bind(null, tradeId)} onSubmit={(event) => event.stopPropagation()}>
            <DeleteSubmitButton label={t("confirmDelete")} pendingLabel={t("deleting")} />
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FirstRunEmptyState({ symbolOptions, setupOptions }: { symbolOptions: string[]; setupOptions: string[] }) {
  const t = useTranslations("dashboard.manualJournal");
  const tips = [
    { icon: ImagePlus, title: t("tipPasteImageTitle"), description: t("tipPasteImageDescription") },
    { icon: Tags, title: t("tipSetupTitle"), description: t("tipSetupDescription") },
    { icon: SlidersHorizontal, title: t("tipFilterTitle"), description: t("tipFilterDescription") },
  ];

  return (
    <div className="rounded-md border border-dashed border-border p-8 text-center">
      <p className="text-sm font-semibold">{t("firstRunTitle")}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">{t("firstRunSubtitle")}</p>
      <div className="mx-auto mt-6 grid max-w-2xl gap-3 text-left sm:grid-cols-3">
        {tips.map((tip) => (
          <div key={tip.title} className="space-y-1.5 rounded-md border border-border bg-background p-3">
            <tip.icon className="h-4 w-4 text-muted-foreground" />
            <p className="text-xs font-medium">{tip.title}</p>
            <p className="text-xs text-muted-foreground">{tip.description}</p>
          </div>
        ))}
      </div>
      <TradeDialog title={t("addJournalEntry")} symbolOptions={symbolOptions} setupOptions={setupOptions}>
        <Button className="mt-6 gap-2">
          <Plus className="h-4 w-4" />
          {t("addFirstEntry")}
        </Button>
      </TradeDialog>
    </div>
  );
}

function DeleteSubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="destructive" disabled={pending} className="gap-2">
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? pendingLabel : label}
    </Button>
  );
}

function computeDrawdownStats(chartData: { date: string; cumulativePnl: number }[]) {
  let peak = 0;
  let peakDate: string | null = null;
  let drawdownStartDate: string | null = null;
  let maxDrawdown = 0;
  let maxDurationDays = 0;

  chartData.forEach((point) => {
    if (point.cumulativePnl >= peak) {
      peak = point.cumulativePnl;
      peakDate = point.date;
      drawdownStartDate = null;
      return;
    }

    if (!drawdownStartDate) drawdownStartDate = peakDate;

    const drawdown = peak - point.cumulativePnl;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;

    if (drawdownStartDate) {
      const days = Math.round(
        (new Date(point.date).getTime() - new Date(drawdownStartDate).getTime()) / (24 * 60 * 60 * 1000)
      );
      if (days > maxDurationDays) maxDurationDays = days;
    }
  });

  return { maxDrawdown, maxDurationDays };
}

function computeConsistencyScore(chartData: { dailyPnl: number }[]) {
  const profitableDays = chartData.filter((point) => point.dailyPnl > 0);
  const totalProfitDays = profitableDays.reduce((sum, point) => sum + point.dailyPnl, 0);

  if (totalProfitDays <= 0) return 0;

  const bestDay = Math.max(...profitableDays.map((point) => point.dailyPnl));

  return Math.max(0, 100 - (bestDay / totalProfitDays) * 100);
}

function StatCard({
  label,
  value,
  helper,
  className,
  tone = "neutral",
}: {
  label: string;
  value: React.ReactNode;
  helper?: string;
  className?: string;
  tone?: "success" | "danger" | "neutral" | "mixed";
}) {
  return (
    <Card
      className={cn(
        "relative overflow-hidden border-border bg-card",
        tone === "success" && "border-success/20 bg-success/[0.03]",
        tone === "danger" && "border-destructive/20 bg-destructive/[0.03]",
        tone === "neutral" && "bg-muted/10",
        tone === "mixed" && "bg-gradient-to-br from-success/[0.04] via-card to-destructive/[0.04]"
      )}
    >
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-px",
          tone === "success" && "bg-success/70",
          tone === "danger" && "bg-destructive/70",
          tone === "neutral" && "bg-foreground/30",
          tone === "mixed" && "bg-gradient-to-r from-success/70 via-border to-destructive/70"
        )}
      />
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={cn("mt-1 text-xl font-bold", className)}>{value}</p>
        {helper && <p className="mt-1 text-xs text-muted-foreground">{helper}</p>}
      </CardContent>
    </Card>
  );
}

function buildChartData(trades: Trade[]) {
  const groupedTrades = new Map<string, { dailyPnl: number; wins: number; entries: number }>();

  [...trades]
    .sort((a, b) => new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime())
    .forEach((trade) => {
      const date = formatDateInput(new Date(trade.tradeDate));
      const result = getTradeResult(trade);
      const current = groupedTrades.get(date) || { dailyPnl: 0, wins: 0, entries: 0 };

      groupedTrades.set(date, {
        dailyPnl: current.dailyPnl + result,
        wins: current.wins + (result > 0 ? 1 : 0),
        entries: current.entries + 1,
      });
    });

  let cumulativePnl = 0;
  let cumulativeWins = 0;
  let cumulativeEntries = 0;

  return Array.from(groupedTrades.entries()).map(([date, value]) => {
    cumulativePnl += value.dailyPnl;
    cumulativeWins += value.wins;
    cumulativeEntries += value.entries;

    return {
      date,
      dailyPnl: Number(value.dailyPnl.toFixed(2)),
      cumulativePnl: Number(cumulativePnl.toFixed(2)),
      winRate: Number(((cumulativeWins / cumulativeEntries) * 100).toFixed(1)),
    };
  });
}

function FilterMenu({
  label,
  options,
  selected,
  onChange,
  formatOption = (option) => option,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  formatOption?: (option: string) => string;
}) {
  const t = useTranslations("dashboard.manualJournal");
  function toggleOption(option: string) {
    onChange(selected.includes(option) ? selected.filter((item) => item !== option) : [...selected, option]);
  }

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button type="button" variant="outline" className="w-full justify-between font-normal" />}>
          <span className="truncate">
            {selected.length > 0 ? t("selectedCount", { count: selected.length }) : t("allLabel", { label: label.toLowerCase() })}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-64">
          {selected.length > 0 && (
            <DropdownMenuItem onClick={() => onChange([])}>
              {t("clearLabel", { label: label.toLowerCase() })}
            </DropdownMenuItem>
          )}
          {options.length === 0 ? (
            <DropdownMenuItem disabled>{t("noOptions")}</DropdownMenuItem>
          ) : (
            options.map((option) => (
              <DropdownMenuItem key={option} onClick={() => toggleOption(option)}>
                <span className="w-4 text-xs">{selected.includes(option) ? "✓" : ""}</span>
                {formatOption(option)}
              </DropdownMenuItem>
            ))
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map((option) => (
            <Badge key={option} variant="secondary">{formatOption(option)}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function TradeDialog({
  title,
  trade,
  symbolOptions,
  setupOptions,
  triggerClassName,
  children,
}: {
  title: string;
  trade?: Trade;
  symbolOptions: string[];
  setupOptions: string[];
  triggerClassName?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("dashboard.manualJournal");
  const [open, setOpen] = useState(false);
  const initialNoteDocument = useMemo(() => parseBlockNoteDocument(trade?.note), [trade?.note]);
  const [noteValue, setNoteValue] = useState<BlockNoteDocument>(initialNoteDocument);
  const [pendingImages, setPendingImages] = useState<PastedBlockNoteImage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const keepNoteOnCloseRef = useRef(false);
  const action = trade ? updateTrade.bind(null, trade.id) : createTrade;
  const symbolInputId = `symbol-${trade?.id || "new"}`;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      pendingImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      setPendingImages([]);
      setSubmitError(null);

      if (!keepNoteOnCloseRef.current) {
        setNoteValue(initialNoteDocument);
      }

      keepNoteOnCloseRef.current = false;
    }

    setOpen(nextOpen);
  }

  async function uploadImage(image: File) {
    const formData = new FormData();
    formData.append("image", image);

    const response = await fetch("/api/trade-note-images", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error || t("uploadImageError"));
    }

    return (await response.json()) as { url: string };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError(null);

    try {
      const formData = new FormData(event.currentTarget);
      const finalNote = await replacePastedImageUrls(noteValue, pendingImages, uploadImage);

      formData.set("note", isEmptyBlockNoteDocument(finalNote) ? "" : JSON.stringify(finalNote));
      await action(formData);
      pendingImages.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      setPendingImages([]);
      setNoteValue(finalNote);
      keepNoteOnCloseRef.current = true;
      handleOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : t("saveEntryError"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Drawer open={open} onOpenChange={handleOpenChange} swipeDirection="right">
      <DrawerTrigger nativeButton={false} render={<div className={cn("inline-flex", triggerClassName)} />}>
        {children}
      </DrawerTrigger>
      <DrawerContent className="[--drawer-content-width:90vw]! sm:[--drawer-content-width:50vw]!">
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
          <DrawerDescription>{t("dialogDescription")}</DrawerDescription>
        </DrawerHeader>
        <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
          <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={symbolInputId}>{t("symbol")} <span className="text-destructive">*</span></Label>
                <SymbolCombobox id={symbolInputId} defaultValue={trade?.symbol || ""} options={symbolOptions} />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`result-${trade?.id || "new"}`}>{t("result")} <span className="text-destructive">*</span></Label>
                <Input id={`result-${trade?.id || "new"}`} name="result" type="number" step="0.01" defaultValue={trade?.result ?? ""} placeholder={t("resultPlaceholder")} required />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("timestamp")}</Label>
                <TimestampPicker defaultValue={trade?.tradeDate} />
                <p className="text-xs text-muted-foreground">{t("timestampHelper")}</p>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>{t("setup")}</Label>
                <SetupCombobox defaultValue={parseSetupTags(trade?.setup)} options={setupOptions} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor={`note-${trade?.id || "new"}`}>{t("note")}</Label>
              <input type="hidden" name="note" value={isEmptyBlockNoteDocument(noteValue) ? "" : JSON.stringify(noteValue)} />
              <DynamicBlockNoteNoteEditor
                key={`${trade?.id || "new"}-${open ? "open" : "closed"}`}
                initialContent={noteValue.length ? noteValue : emptyBlockNoteDocument}
                onChange={setNoteValue}
                onPasteImage={(image) => setPendingImages((images) => [...images, image])}
                className="min-h-[22rem]"
              />
            </div>

            {submitError && <p className="text-xs text-destructive">{submitError}</p>}
          </div>
          <DrawerFooter>
            <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
              {submitting ? t("saving") : t("saveEntry")}
            </Button>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}

function formatDateInput(value: Date) {
  const offsetDate = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);

  return offsetDate.toISOString().slice(0, 10);
}

function TimestampPicker({ defaultValue }: { defaultValue?: Date | string }) {
  const t = useTranslations("dashboard.manualJournal");
  const [date, setDate] = useState(() => (defaultValue ? new Date(defaultValue) : new Date()));

  function selectDate(nextDate?: Date) {
    if (!nextDate) return;

    const nextValue = new Date(date);
    nextValue.setFullYear(nextDate.getFullYear(), nextDate.getMonth(), nextDate.getDate());
    setDate(nextValue);
  }

  function selectTime(time: string) {
    const [hours, minutes] = time.split(":").map(Number);

    if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return;

    const nextValue = new Date(date);
    nextValue.setHours(hours, minutes, 0, 0);
    setDate(nextValue);
  }

  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_8rem]">
      <input type="hidden" name="tradeDate" value={date.toISOString()} />
      <DatePicker date={date} onSelect={selectDate} className="justify-start gap-2 text-left font-normal" />
      <Input
        type="time"
        value={format(date, "HH:mm")}
        onChange={(event) => selectTime(event.target.value)}
        aria-label={t("tradeTime")}
        required
      />
    </div>
  );
}

function formatSession(session: string) {
  return session
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function SetupCombobox({ defaultValue, options }: { defaultValue: string[]; options: string[] }) {
  const t = useTranslations("dashboard.manualJournal");
  const [selectedSetups, setSelectedSetups] = useState(defaultValue);
  const [value, setValue] = useState("");
  const [open, setOpen] = useState(false);
  const normalizedValue = normalizeSetupTag(value);
  const filteredOptions = options.filter(
    (option) => !selectedSetups.includes(option) && option.toLowerCase().includes(normalizedValue.toLowerCase())
  );
  const canCreate = normalizedValue && !selectedSetups.includes(normalizedValue) && !options.includes(normalizedValue);

  function addSetup(setup: string) {
    const normalizedSetup = normalizeSetupTag(setup);

    if (!normalizedSetup || selectedSetups.includes(normalizedSetup)) return;

    setSelectedSetups([...selectedSetups, normalizedSetup].sort((a, b) => a.localeCompare(b)));
    setValue("");
    setOpen(false);
  }

  function removeSetup(setup: string) {
    setSelectedSetups(selectedSetups.filter((selectedSetup) => selectedSetup !== setup));
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name="setup" value={serializeSetupTags(selectedSetups) || ""} />
      <div className="relative flex min-h-9 flex-wrap items-center gap-1.5 rounded-[5px] border border-border bg-transparent px-2 py-1.5 focus-within:border-[#333333] focus-within:ring-1 focus-within:ring-[#333333]/50">
        {selectedSetups.map((setup) => (
          <Badge key={setup} variant="secondary" className="gap-1 pr-1">
            {setup}
            <button
              type="button"
              onClick={() => removeSetup(setup)}
              className="rounded-sm text-muted-foreground hover:text-foreground"
              aria-label={t("removeSetup", { setup })}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        <input
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            if (value) addSetup(value);
            window.setTimeout(() => setOpen(false), 100);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addSetup(value);
            }
          }}
          placeholder={selectedSetups.length ? t("addSetupPlaceholder") : t("setupPlaceholder")}
          className="h-6 min-w-32 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/60"
        />
        {open && (
          <div className="absolute top-full left-0 z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-[6px] border border-border bg-popover p-1 text-popover-foreground shadow-md">
            {canCreate && (
              <button type="button" className="flex w-full items-center rounded-md px-1.5 py-1 text-left text-sm hover:bg-accent hover:text-accent-foreground" onMouseDown={(event) => event.preventDefault()} onClick={() => addSetup(normalizedValue)}>
                {t("createValue", { value: normalizedValue })}
              </button>
            )}
            {filteredOptions.map((setup) => (
              <button key={setup} type="button" className="flex w-full items-center rounded-md px-1.5 py-1 text-left text-sm hover:bg-accent hover:text-accent-foreground" onMouseDown={(event) => event.preventDefault()} onClick={() => addSetup(setup)}>
                {setup}
              </button>
            ))}
            {filteredOptions.length === 0 && !canCreate && (
              <div className="px-1.5 py-1 text-sm text-muted-foreground">{value ? t("noMatchingSetup") : t("noSetupHistory")}</div>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">{t("setupHelper")}</p>
    </div>
  );
}

function SymbolCombobox({ id, defaultValue, options }: { id: string; defaultValue: string; options: string[] }) {
  const t = useTranslations("dashboard.manualJournal");
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const normalizedValue = value.trim().toUpperCase();
  const filteredOptions = options.filter((symbol) => symbol.includes(normalizedValue));
  const exactMatch = options.some((symbol) => symbol === normalizedValue);

  function selectSymbol(symbol: string) {
    setValue(symbol);
    setOpen(false);
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger nativeButton={false} render={<div className="w-full" />}>
        <Input
          id={id}
          name="symbol"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            if (normalizedValue) setValue(normalizedValue);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              selectSymbol(normalizedValue);
            }
          }}
          placeholder={t("symbolPlaceholder")}
          autoComplete="off"
          required
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-56">
        {normalizedValue && !exactMatch && (
          <DropdownMenuItem onClick={() => selectSymbol(normalizedValue)}>
            {t("createSymbol", { symbol: normalizedValue })}
          </DropdownMenuItem>
        )}
        {filteredOptions.map((symbol) => (
          <DropdownMenuItem key={symbol} onClick={() => selectSymbol(symbol)}>
            #{symbol}
          </DropdownMenuItem>
        ))}
        {filteredOptions.length === 0 && !normalizedValue && (
          <DropdownMenuItem disabled>{t("noSymbolHistory")}</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
