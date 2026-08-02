"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getTradeDateKey, getTradeResult, type Trade } from "@/lib/trade";
import { useTranslations } from "next-intl";

interface CalendarTabProps {
  trades: Trade[];
}

const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export function CalendarTab({ trades }: CalendarTabProps) {
  const t = useTranslations("dashboard.calendarTab");
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  const days = useMemo(() => buildCalendarDays(startDay, daysInMonth), [daysInMonth, startDay]);
  const dailyPnl = useMemo(() => buildDailyPnl(trades), [trades]);
  const monthTrades = useMemo(() => filterTradesByMonth(trades, year, month), [month, trades, year]);
  const monthPnl = monthTrades.reduce((sum, trade) => sum + getTradeResult(trade), 0);
  const monthWins = monthTrades.filter((trade) => getTradeResult(trade) > 0).length;
  const monthWinRate =
    monthTrades.length > 0
      ? ((monthWins / monthTrades.length) * 100).toFixed(1)
      : "0";

  const prevMonth = () =>
    setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () =>
    setCurrentDate(new Date(year, month + 1, 1));

  const monthName = currentDate.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-6">
      {/* Monthly summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("monthlyPnl")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={cn(
                "text-2xl font-bold font-mono",
                monthPnl >= 0 ? "text-success" : "text-destructive"
              )}
            >
              {monthPnl >= 0 ? "+" : ""}${monthPnl.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("tradesThisMonth")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{monthTrades.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t("winRate")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{monthWinRate}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Calendar */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <Button variant="ghost" size="icon" onClick={prevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="text-lg">{monthName}</CardTitle>
          <Button variant="ghost" size="icon" onClick={nextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1">
            {/* Day headers */}
            {dayKeys.map((key) => (
              <div
                key={key}
                className="pb-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                {t(key)}
              </div>
            ))}

            {/* Calendar cells */}
            {days.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} />;
              }

              const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const pnl = dailyPnl[dateKey];
              const hasData = pnl !== undefined;
              const todayKey = new Date().toISOString().split("T")[0];
              const isToday = todayKey === dateKey;
              const isFuture = dateKey > todayKey;

              return (
                <div
                  key={dateKey}
                  className={cn(
                    "relative flex min-h-[76px] flex-col items-center rounded-[4px] border p-2 text-sm transition-colors",
                    isToday
                      ? "border-foreground/25 bg-muted"
                      : "border-border",
                    hasData && pnl > 0 && "border-success/20 bg-success/5",
                    hasData && pnl < 0 && "border-destructive/20 bg-destructive/5",
                    isFuture && !isToday && "opacity-40"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-mono",
                      isToday
                        ? "font-bold text-foreground"
                        : hasData
                          ? "text-foreground/80"
                          : "text-muted-foreground"
                    )}
                  >
                    {day}
                  </span>
                  {hasData ? (
                    <span
                      className={cn(
                        "mt-auto text-xs font-mono font-medium",
                        pnl > 0 ? "text-success" : "text-destructive"
                      )}
                    >
                      {pnl > 0 ? "+" : ""}${pnl.toFixed(0)}
                    </span>
                  ) : (
                    !isFuture && (
                      <span className="mt-auto h-1 w-1 rounded-full bg-border" />
                    )
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function buildCalendarDays(startDay: number, daysInMonth: number) {
  return [
    ...Array.from({ length: startDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
  ];
}

function buildDailyPnl(trades: Trade[]) {
  return trades.reduce<Record<string, number>>((dailyPnl, trade) => {
    const key = getTradeDateKey(trade);
    dailyPnl[key] = (dailyPnl[key] || 0) + getTradeResult(trade);

    return dailyPnl;
  }, {});
}

function filterTradesByMonth(trades: Trade[], year: number, month: number) {
  return trades.filter((trade) => {
    const tradeDate = new Date(trade.tradeDate);

    return tradeDate.getMonth() === month && tradeDate.getFullYear() === year;
  });
}
