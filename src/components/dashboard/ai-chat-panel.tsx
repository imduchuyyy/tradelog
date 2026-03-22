"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  BarChart2,
  BookOpen,
  Zap,
  Wrench,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@ai-sdk/react";
import { cn } from "@/lib/utils";
import type { TradeNotification } from "@/components/dashboard/shell";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface AIChatPanelProps {
  chatSessions?: any[];
  user?: any;
  tradeContext?: any;
  tradeNotifications?: TradeNotification[];
  onClearNotification?: (tradeId: string) => void;
}

// ─── Helpers for SDK v6 UIMessage ────────────────────────────────────────────

/** Extract concatenated text from a UIMessage's parts array */
function getMessageText(message: any): string {
  // SDK v6: parts array
  if (message.parts && Array.isArray(message.parts)) {
    return message.parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text || "")
      .join("");
  }
  // Fallback: legacy content string
  if (typeof message.content === "string") return message.content;
  return "";
}

/** Extract tool invocation parts from a UIMessage */
function getToolParts(message: any): any[] {
  if (!message.parts || !Array.isArray(message.parts)) return [];
  return message.parts.filter(
    (p: any) =>
      p.type === "dynamic-tool" || (typeof p.type === "string" && p.type.startsWith("tool-"))
  );
}

/** Get tool name from a part */
function getToolName(part: any): string {
  if (part.type === "dynamic-tool") return part.toolName || "unknown";
  // type is "tool-{name}" — extract the name
  if (typeof part.type === "string" && part.type.startsWith("tool-")) {
    return part.type.slice(5);
  }
  return "unknown";
}

/** Check if a tool part has completed output */
function hasToolOutput(part: any): boolean {
  return part.state === "output-available";
}

export function AIChatPanel({
  chatSessions,
  user,
  tradeContext,
  tradeNotifications = [],
  onClearNotification,
}: AIChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedTradeContext = useRef<string | null>(null);
  const processedNotifications = useRef<Set<string>>(new Set());

  const {
    messages,
    sendMessage,
    status,
  } = useChat({
    api: "/api/chat",
    body: { context: "dashboard" },
  } as any) as any;

  const [input, setInput] = useState("");
  const isLoading = status === "submitted" || status === "streaming";

  const handleSubmit = (e?: React.FormEvent | Event) => {
    e?.preventDefault?.();
    if (!input?.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Inject trade context into conversation (from dashboard "Journal with AI" buttons)
  useEffect(() => {
    if (tradeContext && tradeContext.id !== initializedTradeContext.current) {
      initializedTradeContext.current = tradeContext.id;
      const isWin = tradeContext.pnl && Number(tradeContext.pnl) > 0;
      sendMessage({
        text: `I want to journal this trade: ${tradeContext.symbol} (${tradeContext.side?.toUpperCase()}). It was ${isWin ? "a winning trade" : "a losing trade"} with a realized PnL of $${tradeContext.pnl}. Can you help me log my psychology?`,
      });
    }
  }, [tradeContext, sendMessage]);

  // Process trade notifications — inject system-like messages into the chat
  useEffect(() => {
    if (tradeNotifications.length === 0) return;
    if (isLoading) return;

    for (const notification of tradeNotifications) {
      const key = `${notification.type}-${notification.trade.id}`;
      if (processedNotifications.current.has(key)) continue;
      processedNotifications.current.add(key);

      const trade = notification.trade;

      if (notification.type === "new_trade") {
        sendMessage({
          text: `[SYSTEM NOTIFICATION] A new trade was just opened: ${trade.symbol} ${trade.side?.toUpperCase()} at entry price ${trade.entryPrice || "market"}. Trade ID: ${trade.id}. Please ask me about my entry reasons, risk/reward plan, and which market conditions are present.`,
        });
      } else if (notification.type === "closed_trade") {
        const isWin = trade.pnl !== undefined && Number(trade.pnl) > 0;
        sendMessage({
          text: `[SYSTEM NOTIFICATION] A trade was just closed: ${trade.symbol} ${trade.side?.toUpperCase()} — ${isWin ? "WIN" : "LOSS"} with PnL of $${trade.pnl?.toFixed(2)}. Trade ID: ${trade.id}. Please help me journal the exit: why did it hit SL/TP, lessons learned, and post-trade review.`,
        });
      }

      onClearNotification?.(trade.id);
    }
  }, [tradeNotifications, isLoading, sendMessage, onClearNotification]);

  const messageList = messages || [];

  return (
    <div className="flex h-full flex-col bg-background/50 relative overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-hide pb-28">
        {/* Empty state */}
        {messageList.length === 0 && !tradeContext && (
          <div className="bg-secondary/20 p-5 rounded-2xl text-sm text-center text-muted-foreground flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="h-11 w-11 rounded-2xl bg-primary/10 flex items-center justify-center">
              <BarChart2 className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-foreground text-sm">
                Your AI Trading Coach
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ask about your win rate, analyze conditions, journal trades, or
                get insights on your performance.
              </p>
            </div>
            <div className="w-full space-y-1.5 mt-1">
              {[
                "What's my win rate this month?",
                "Which conditions perform best?",
                "Analyze my last 10 trades",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage({ text: suggestion })}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg bg-card border border-border/40 text-muted-foreground hover:text-foreground hover:bg-secondary/40 transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <div className="w-full h-px bg-border/30" />
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50">
              Always listening for new trades
            </p>
          </div>
        )}

        {/* Messages */}
        {messageList.map((m: any) => {
          const text = getMessageText(m);
          const toolParts = getToolParts(m);
          const isSystemNotification =
            m.role === "user" && text.startsWith("[SYSTEM NOTIFICATION]");

          // Render system notifications as centered pills
          if (isSystemNotification) {
            const isNewTrade = text.includes("new trade was just opened");
            return (
              <div
                key={m.id}
                className="flex justify-center animate-in fade-in duration-300"
              >
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-full text-xs font-medium border",
                    isNewTrade
                      ? "bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-400"
                  )}
                >
                  {isNewTrade ? (
                    <TrendingUp className="h-3.5 w-3.5" />
                  ) : (
                    <TrendingDown className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {isNewTrade ? "New trade detected" : "Trade closed"}
                  </span>
                  <Bell className="h-3 w-3 animate-pulse" />
                </div>
              </div>
            );
          }

          return (
            <div
              key={m.id}
              className={cn(
                "flex flex-col gap-1.5 animate-in fade-in duration-300",
                m.role === "user" ? "items-end" : "items-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[90%] px-4 py-3 text-[13px] leading-relaxed",
                  m.role === "user"
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none shadow-md"
                    : "bg-card border border-border/50 rounded-2xl rounded-tl-none shadow-sm"
                )}
              >
                {text && (
                  <span className="whitespace-pre-wrap">{text}</span>
                )}

                {/* Tool UI Rendering */}
                {toolParts.map((part: any) => {
                  const toolName = getToolName(part);
                  const done = hasToolOutput(part);

                  if (toolName === "getStats") {
                    return (
                      <div
                        key={part.toolCallId}
                        className="mt-3 flex items-center gap-2.5 text-muted-foreground bg-secondary/40 px-3 py-2 rounded-xl text-xs border border-border/30"
                      >
                        {done ? (
                          <>
                            <BarChart2 className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="font-medium">Stats loaded successfully</span>
                          </>
                        ) : (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                            <span className="italic">Fetching your trading stats...</span>
                          </>
                        )}
                      </div>
                    );
                  }

                  if (toolName === "getConditionAnalytics") {
                    return (
                      <div
                        key={part.toolCallId}
                        className="mt-3 flex items-center gap-2.5 text-muted-foreground bg-blue-500/5 px-3 py-2 rounded-xl text-xs border border-blue-500/20"
                      >
                        {done ? (
                          <>
                            <Zap className="h-3.5 w-3.5 text-blue-500" />
                            <span className="font-medium">Condition analytics loaded</span>
                          </>
                        ) : (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                            <span className="italic">Analyzing conditions...</span>
                          </>
                        )}
                      </div>
                    );
                  }

                  if (toolName === "getDetailedAnalytics") {
                    return (
                      <div
                        key={part.toolCallId}
                        className="mt-3 flex items-center gap-2.5 text-muted-foreground bg-purple-500/5 px-3 py-2 rounded-xl text-xs border border-purple-500/20"
                      >
                        {done ? (
                          <>
                            <BarChart2 className="h-3.5 w-3.5 text-purple-500" />
                            <span className="font-medium">Detailed analytics ready</span>
                          </>
                        ) : (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-purple-500" />
                            <span className="italic">Running deep analysis...</span>
                          </>
                        )}
                      </div>
                    );
                  }

                  if (toolName === "createMarketConditions") {
                    return (
                      <div
                        key={part.toolCallId}
                        className="mt-3 p-2.5 bg-blue-500/5 rounded-xl border border-blue-500/20"
                      >
                        {done ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 text-blue-500 font-medium text-xs">
                              <Zap className="h-3.5 w-3.5" />
                              <span>Conditions Saved</span>
                            </div>
                            {part.output?.created?.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {part.output.created.map((c: string) => (
                                  <span
                                    key={c}
                                    className="text-[11px] bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full px-2 py-0.5"
                                  >
                                    {c}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-muted-foreground text-xs">
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                            <span className="italic">Saving conditions...</span>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (toolName === "createSetup") {
                    return (
                      <div
                        key={part.toolCallId}
                        className="mt-3 flex items-center gap-2.5 text-muted-foreground bg-emerald-500/5 px-3 py-2 rounded-xl text-xs border border-emerald-500/20"
                      >
                        {done ? (
                          <>
                            <Wrench className="h-3.5 w-3.5 text-emerald-500" />
                            <span className="font-medium">
                              Setup created: {part.output?.setupName || part.input?.setupName}
                            </span>
                          </>
                        ) : (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                            <span className="italic">Creating setup...</span>
                          </>
                        )}
                      </div>
                    );
                  }

                  if (toolName === "addTradeJournal") {
                    return (
                      <div
                        key={part.toolCallId}
                        className="mt-3 flex items-center gap-2.5 text-muted-foreground bg-amber-500/5 px-3 py-2 rounded-xl text-xs border border-amber-500/20"
                      >
                        {done ? (
                          <>
                            <BookOpen className="h-3.5 w-3.5 text-amber-500" />
                            <span className="font-medium">Entry journal saved</span>
                          </>
                        ) : (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                            <span className="italic">Logging trade entry...</span>
                          </>
                        )}
                      </div>
                    );
                  }

                  if (toolName === "journalTrade") {
                    return (
                      <div
                        key={part.toolCallId}
                        className="mt-3 flex items-center gap-2.5 text-muted-foreground bg-amber-500/5 px-3 py-2 rounded-xl text-xs border border-amber-500/20"
                      >
                        {done ? (
                          <>
                            <BookOpen className="h-3.5 w-3.5 text-amber-500" />
                            <span className="font-medium">Trade journal updated</span>
                          </>
                        ) : (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
                            <span className="italic">Saving trade journal...</span>
                          </>
                        )}
                      </div>
                    );
                  }

                  // Fallback
                  return (
                    <div
                      key={part.toolCallId}
                      className="mt-3 flex items-center gap-2 text-muted-foreground text-xs"
                    >
                      {done ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          <span>Done</span>
                        </>
                      ) : (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Processing...</span>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Loading indicator */}
        {isLoading && messageList.length > 0 && messageList[messageList.length - 1]?.role !== "assistant" && (
          <div className="flex flex-col items-start gap-1">
            <div className="rounded-2xl rounded-tl-none bg-card border border-border/50 px-4 py-3 shadow-sm">
              <div className="flex gap-1.5 opacity-50">
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-blue-500 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} className="h-4" />
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 left-0 right-0 pt-4 pb-4 px-3 bg-gradient-to-t from-background via-background to-transparent z-10 pointer-events-none">
        <form
          onSubmit={handleSubmit}
          className="pointer-events-auto flex items-end gap-2 bg-card border border-border/80 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/40 transition-all shadow-xl shadow-black/5"
        >
          <textarea
            value={input || ""}
            onChange={(e) => {
              setInput(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (input?.trim() && !isLoading) {
                  const event = new Event("submit", {
                    cancelable: true,
                    bubbles: true,
                  });
                  e.currentTarget.form?.dispatchEvent(event);
                }
              }
            }}
            disabled={isLoading}
            placeholder="Ask about your trades..."
            className="flex-1 bg-transparent border-0 focus:ring-0 text-[13px] py-1.5 px-3 resize-none min-h-[38px] max-h-[140px] placeholder:text-muted-foreground/40 leading-relaxed ring-0 outline-none appearance-none"
            rows={1}
            autoFocus
          />
          <Button
            type="submit"
            disabled={isLoading || !input?.trim()}
            className="h-9 w-9 p-0 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 active:scale-90 transition-all shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
