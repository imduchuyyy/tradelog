"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  BarChart3,
  Calendar,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Sparkles,
  Wrench,
  X,
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

type Tab = "dashboard" | "calendar" | "setups" | "settings";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  trades: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setups: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  exchanges: any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chatSessions: any[];
}

const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "calendar", label: "Calendar", icon: Calendar },
  { id: "setups", label: "Setups", icon: Wrench },
  { id: "settings", label: "Settings", icon: Settings },
];

export function DashboardShell({
  user,
  trades,
  setups,
  exchanges,
  chatSessions,
}: DashboardShellProps) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [chatOpen, setChatOpen] = useState(false);

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
      <aside className="hidden w-64 flex-col border-r border-border/40 bg-card/30 md:flex">
        {/* Logo */}
        <div className="flex h-16 items-center gap-2.5 border-b border-border/40 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <BarChart3 className="h-4 w-4 text-white" />
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
                  ? "bg-primary/10 text-primary"
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
          <div className="mx-3 mb-3 rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
            <p className="text-xs font-medium text-blue-500">Free Trial</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {trialDaysLeft} days remaining
            </p>
          </div>
        )}

        {/* User section */}
        <div className="border-t border-border/40 p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback className="text-xs">
                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium">
                {user.name || "Trader"}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => signOut({ callbackUrl: "/" })}
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-border/40 px-4 md:px-6">
          {/* Mobile nav */}
          <div className="flex items-center gap-2 md:hidden">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
              <BarChart3 className="h-3.5 w-3.5 text-white" />
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
              {tabs.find((t) => t.id === activeTab)?.label}
            </h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {user.plan === "trial" && (
              <Badge variant="outline" className="text-xs">
                Trial: {trialDaysLeft}d left
              </Badge>
            )}
            <Button
              variant={chatOpen ? "default" : "outline"}
              size="sm"
              onClick={() => setChatOpen(!chatOpen)}
              className="gap-2"
            >
              {chatOpen ? (
                <X className="h-3.5 w-3.5" />
              ) : (
                <Sparkles className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">AI Chat</span>
            </Button>
          </div>
        </header>

        {/* Content area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Tab content */}
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {activeTab === "dashboard" && (
              <DashboardTab trades={trades} setups={setups} />
            )}
            {activeTab === "calendar" && <CalendarTab trades={trades} />}
            {activeTab === "setups" && <SetupsTab setups={setups} trades={trades} />}
            {activeTab === "settings" && (
              <SettingsTab user={user} exchanges={exchanges} />
            )}
          </main>

          {/* AI Chat sidebar */}
          {chatOpen && (
            <aside className="w-80 border-l border-border/40 bg-card/20 lg:w-96">
              <AIChatPanel chatSessions={chatSessions} />
            </aside>
          )}
        </div>
      </div>

      {/* Mobile bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 flex border-t border-border/40 bg-background md:hidden z-50">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2 text-[10px]",
              activeTab === tab.id
                ? "text-primary"
                : "text-muted-foreground"
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
        <button
          onClick={() => setChatOpen(!chatOpen)}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2 text-[10px]",
            chatOpen ? "text-primary" : "text-muted-foreground"
          )}
        >
          <MessageSquare className="h-4 w-4" />
          AI
        </button>
      </div>

      {/* Trade sync — auto-fetches from exchanges on mount */}
      <TradeSync
        setups={setups}
        hasExchanges={exchanges.length > 0}
      />
    </div>
  );
}
