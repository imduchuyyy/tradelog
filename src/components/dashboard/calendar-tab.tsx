"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface CalendarTabProps {
  trades: any[];
}

export function CalendarTab({ trades }: CalendarTabProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDay = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  // Calculate PnL per day
  const dailyPnl: Record<string, number> = {};
  trades
    .filter((t: any) => t.status === "closed" && t.pnl !== null)
    .forEach((t: any) => {
      const date = t.exitDate || t.entryDate;
      const key = new Date(date).toISOString().split("T")[0];
      dailyPnl[key] = (dailyPnl[key] || 0) + t.pnl;
    });

  // Monthly stats
  const monthTrades = trades.filter((t: any) => {
    const d = new Date(t.entryDate);
    return (
      d.getMonth() === month &&
      d.getFullYear() === year &&
      t.status === "closed"
    );
  });
  const monthPnl = monthTrades.reduce(
    (sum: number, t: any) => sum + (t.pnl || 0),
    0
  );
  const monthWins = monthTrades.filter((t: any) => t.pnl && t.pnl > 0).length;
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

  const days = [];
  // Empty cells for days before month starts
  for (let i = 0; i < startDay; i++) {
    days.push(null);
  }
  // Actual days
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  return (
    <div className="space-y-6">
      {/* Monthly summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly PnL
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
              Trades This Month
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold font-mono">{monthTrades.length}</p>
          </CardContent>
        </Card>
        <Card className="border-border bg-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Win Rate
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
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
              (day) => (
                <div
                  key={day}
                  className="pb-2 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider"
                >
                  {day}
                </div>
              )
            )}

            {/* Calendar cells */}
            {days.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} />;
              }

              const dateKey = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const pnl = dailyPnl[dateKey];
              const hasData = pnl !== undefined;
              const isToday =
                new Date().toISOString().split("T")[0] === dateKey;

              return (
                <div
                  key={dateKey}
                  className={cn(
                    "relative flex min-h-[70px] flex-col items-center rounded-[4px] border p-1.5 text-sm transition-colors",
                    isToday
                      ? "border-foreground/20 bg-muted"
                      : "border-border",
                    hasData && pnl > 0 && "bg-success/5",
                    hasData && pnl < 0 && "bg-destructive/5"
                  )}
                >
                  <span
                    className={cn(
                      "text-xs font-mono",
                      isToday
                        ? "font-bold text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {day}
                  </span>
                  {hasData && (
                    <span
                      className={cn(
                        "mt-auto text-xs font-mono font-medium",
                        pnl > 0 ? "text-success" : "text-destructive"
                      )}
                    >
                      {pnl > 0 ? "+" : ""}${pnl.toFixed(0)}
                    </span>
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
