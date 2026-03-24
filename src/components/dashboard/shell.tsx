"use client";

import { useState, useCallback } from "react";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  Calendar,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  RefreshCw,
  Settings,
  Sparkles,
  Wrench,
  X,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { DashboardTab } from "@/components/dashboard/dashboard-tab";
import { CalendarTab } from "@/components/dashboard/calendar-tab";
import { SetupsTab } from "@/components/dashboard/setups-tab";
import { SettingsTab } from "@/components/dashboard/settings-tab";
import { AIChatPanel } from "@/components/dashboard/ai-chat-panel";
import { TradeSync } from "@/components/dashboard/sync/trade-sync";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

type Tab = "dashboard" | "calendar" | "setups" | "settings";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface DashboardShellProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    locale: string;
    theme: string;
    plan: string;
    trialEndsAt: Date | null;
  };
  trades: any[];
  setups: any[];
  exchanges: any[];
  chatSessions: any[];
}

export function DashboardShell({
  user,
  trades,
  setups,
  exchanges,
  chatSessions,
}: DashboardShellProps) {
  const t = useTranslations("dashboard");
  const tc = useTranslations("common");
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [mobileChatOpen, setMobileChatOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatContext, setChatContext] = useState<any>(null);

  // Sync trigger — TradeSync exposes a trigger function, shell calls it
  const [syncTrigger, setSyncTrigger] = useState(0);
  const [newTradeCount, setNewTradeCount] = useState(0);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: t("title"), icon: LayoutDashboard },
    { id: "calendar", label: t("calendar"), icon: Calendar },
    { id: "setups", label: t("setups"), icon: Wrench },
    { id: "settings", label: t("settings"), icon: Settings },
  ];

  const handleOpenChatForContext = (context: any) => {
    setChatContext(context);
    setChatOpen(true);
    setMobileChatOpen(true);
  };

  const handleManualSync = useCallback(() => {
    setSyncTrigger((prev) => prev + 1);
  }, []);

  const handleNewTrades = useCallback((count: number) => {
    setNewTradeCount((prev) => prev + count);
    // Auto-clear highlight after 10s
    setTimeout(() => setNewTradeCount(0), 10000);
  }, []);

  const trialDaysLeft = user.trialEndsAt
    ? Math.max(
        0,
        Math.ceil(
          (new Date(user.trialEndsAt).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-[5px] border border-border bg-card">
            <BarChart3 className="h-4 w-4 text-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight">TradeLog</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                activeTab === tab.id
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Trial banner */}
        {user.plan === "trial" && (
          <div className="mx-3 mb-3 rounded-lg border border-border bg-card p-3">
            <p className="text-xs font-medium text-success">{t("trial")}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("trialDaysLeft", { days: trialDaysLeft })}
            </p>
          </div>
        )}

        {/* User section */}
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback className="text-xs">
                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">
                {user.name || tc("trader")}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => signOut({ callbackUrl: "/" })}
              title={t("signOut")}
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-border px-4 md:px-6">
          {/* Mobile nav */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-[5px] border border-border bg-card">
              <BarChart3 className="h-3.5 w-3.5 text-foreground" />
            </div>
            <select
              value={activeTab}
              onChange={(e) => setActiveTab(e.target.value as Tab)}
              className="bg-transparent text-sm font-medium border-none focus:ring-0"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>
                  {tab.label}
                </option>
              ))}
            </select>
          </div>

          {/* Desktop title */}
          <div className="hidden md:block">
            <h1 className="text-lg font-semibold">
              {tabs.find((tab) => tab.id === activeTab)?.label}
            </h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Manual Sync Button */}
            {exchanges.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualSync}
                className="gap-2 text-xs"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                {t("syncTrades")}
              </Button>
            )}

            {/* New trades notification */}
            {newTradeCount > 0 && (
              <div className="hidden md:flex items-center gap-1.5 rounded-full bg-success/10 border border-success/20 px-3 py-1">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
                </span>
                <span className="text-xs text-success font-medium">
                  {newTradeCount > 1
                    ? t("newTradesSyncedPlural", { count: newTradeCount })
                    : t("newTradesSynced", { count: newTradeCount })}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Tab content */}
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {activeTab === "dashboard" && (
              <DashboardTab trades={trades} setups={setups} onOpenChat={handleOpenChatForContext} />
            )}
            {activeTab === "calendar" && <CalendarTab trades={trades} />}
            {activeTab === "setups" && <SetupsTab setups={setups} trades={trades} />}
            {activeTab === "settings" && (
              <SettingsTab user={user} exchanges={exchanges} />
            )}
          </main>
        </div>
      </div>

      {/* Floating AI Chat — Desktop */}
      <div className="hidden md:block">
        {/* Toggle button */}
        {!chatOpen && (
          <button
            onClick={() => setChatOpen(true)}
            className="fixed bottom-5 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors"
          >
            <Sparkles className="h-5 w-5" />
          </button>
        )}

        {/* Chat box — always mounted, toggled with visibility */}
        <div
          className={cn(
            "fixed bottom-5 right-5 z-50 flex w-[400px] flex-col rounded-[6px] border border-border bg-card overflow-hidden transition-all duration-200",
            chatOpen
              ? "opacity-100 translate-y-0 pointer-events-auto"
              : "opacity-0 translate-y-4 pointer-events-none invisible"
          )}
          style={{ height: "min(600px, calc(100vh - 100px))" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-success" />
              <h3 className="text-sm font-semibold">{t("aiAnalytics")}</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon-xs" onClick={() => setChatOpen(false)} className="h-7 w-7">
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon-xs" onClick={() => setChatOpen(false)} className="h-7 w-7">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          {/* Chat content */}
          <div className="flex-1 overflow-hidden">
            <AIChatPanel
              chatSessions={chatSessions}
              user={user}
              tradeContext={chatContext}
            />
          </div>
        </div>
      </div>

      {/* Mobile chat overlay */}
      {mobileChatOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 bg-background backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-success" />
              <h3 className="text-sm font-semibold">{t("aiAnalytics")}</h3>
            </div>
            <Button variant="ghost" size="icon-xs" onClick={() => setMobileChatOpen(false)} className="h-7 w-7">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden">
            <AIChatPanel
              chatSessions={chatSessions}
              user={user}
              tradeContext={chatContext}
            />
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 flex border-t border-border bg-background md:hidden z-40">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setMobileChatOpen(false);
            }}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[10px]",
              activeTab === tab.id && !mobileChatOpen
                ? "text-foreground"
                : "text-muted-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => setMobileChatOpen(!mobileChatOpen)}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2 text-[10px]",
            mobileChatOpen ? "text-foreground" : "text-muted-foreground"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          {t("aiChat")}
        </button>
      </div>

      {/* Trade sync — manual trigger only */}
      <TradeSync
        hasExchanges={exchanges.length > 0}
        syncTrigger={syncTrigger}
        onNewTrades={handleNewTrades}
      />
    </div>
  );
}
