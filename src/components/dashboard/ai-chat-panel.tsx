"use client";

import { Crown, Sparkles, Send } from "lucide-react";
import { Input } from "@/components/ui/input";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface AIChatPanelProps {
  chatSessions: any[];
  user?: any;
}

export function AIChatPanel({ chatSessions, user }: AIChatPanelProps) {
  const isPro = user?.plan === "pro";

  if (!isPro) {
    return (
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3">
          <Sparkles className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-semibold">AI Trading Assistant</h3>
        </div>

        {/* Locked Content */}
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-card/10">
          <div className="mb-4">
            <Crown className="h-10 w-10 text-yellow-500" strokeWidth={2} />
          </div>
          <h2 className="text-lg font-bold mb-2">Pro Plan Required</h2>
          <p className="text-sm text-muted-foreground mb-6">
            AI chat is available exclusively for Pro plan users.
          </p>
          <p className="text-xs text-muted-foreground/60">
            Use <code className="text-muted-foreground font-mono bg-muted/50 px-1 py-0.5 rounded">/upgrade</code> in Telegram to upgrade
          </p>
        </div>

        {/* Input (Disabled) */}
        <div className="border-t border-border/40 p-3 bg-background/50">
          <div className="relative">
            <Input
              disabled
              placeholder="Pro plan required..."
              className="flex-1 text-sm bg-card/20 border-border/40 pl-3 pr-10"
            />
            <button
              disabled
              className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded bg-emerald-500/80 text-white opacity-80"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Fallback for Pro users (you could restore full chat logic here)
  return (
    <div className="flex h-full flex-col items-center justify-center p-8 text-center text-sm text-muted-foreground">
      Pro User AI Chat (Not fully implemented in mock)
    </div>
  );
}
