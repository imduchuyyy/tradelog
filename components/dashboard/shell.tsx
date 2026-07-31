"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { BarChart3, Calendar, LayoutDashboard, LogOut, Settings, Sparkles, X, Minus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DashboardTab } from "@/components/dashboard/dashboard-tab";
import { CalendarTab } from "@/components/dashboard/calendar-tab";
import { SettingsTab } from "@/components/dashboard/settings-tab";
import { AIChatPanel } from "@/components/dashboard/ai-chat-panel";
import { cn } from "@/lib/utils";
import type { Trade } from "@/lib/trade";

type Tab = "dashboard" | "calendar" | "settings";

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
  trades: Trade[];
  chatSessions: Array<Record<string, unknown>>;
}

export function DashboardShell({ user, trades, chatSessions }: DashboardShellProps) {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");
  const [chatOpen, setChatOpen] = useState(false);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "dashboard", label: "Journal", icon: LayoutDashboard },
    { id: "calendar", label: "Calendar", icon: Calendar },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="hidden w-60 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card">
            <BarChart3 className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">Zennote</span>
        </div>

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

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.image || undefined} />
              <AvatarFallback className="text-xs">
                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name || "Trader"}</p>
              <p className="truncate text-xs text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="ghost" size="icon-xs" onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-14 items-center justify-between border-b border-border px-4 md:px-6">
          <div className="flex items-center gap-2 md:hidden">
            <BarChart3 className="h-4 w-4" />
            <select
              value={activeTab}
              onChange={(event) => setActiveTab(event.target.value as Tab)}
              className="bg-transparent text-sm font-medium"
            >
              {tabs.map((tab) => (
                <option key={tab.id} value={tab.id}>{tab.label}</option>
              ))}
            </select>
          </div>
          <h1 className="hidden text-lg font-semibold md:block">
            {tabs.find((tab) => tab.id === activeTab)?.label}
          </h1>
          <Button variant="outline" size="sm" onClick={() => setChatOpen(true)} className="gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            AI
          </Button>
        </header>

        <main className="flex-1 overflow-auto p-4 pb-20 md:p-6">
          {activeTab === "dashboard" && <DashboardTab trades={trades} />}
          {activeTab === "calendar" && <CalendarTab trades={trades} />}
          {activeTab === "settings" && <SettingsTab user={user} />}
        </main>
      </div>

      <div
        className={cn(
          "fixed bottom-5 right-5 z-50 flex w-[min(400px,calc(100vw-2rem))] flex-col overflow-hidden rounded-md border border-border bg-card transition-all",
          chatOpen ? "opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        )}
        style={{ height: "min(600px, calc(100vh - 100px))" }}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-success" />
            <h3 className="text-sm font-semibold">AI Analytics</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-xs" onClick={() => setChatOpen(false)}>
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <Button variant="ghost" size="icon-xs" onClick={() => setChatOpen(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden">
          <AIChatPanel chatSessions={chatSessions} user={user} tradeContext={null} />
        </div>
      </div>
    </div>
  );
}
