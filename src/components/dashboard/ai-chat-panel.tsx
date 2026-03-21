"use client";

import { useEffect, useRef, useState } from "react";
import { Crown, Sparkles, Send, Loader2, BarChart2, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useChat } from "@ai-sdk/react";
import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface AIChatPanelProps {
  chatSessions?: any[];
  user?: any;
  tradeContext?: any;
}

export function AIChatPanel({ chatSessions, user, tradeContext }: AIChatPanelProps) {
  const isPro = user?.plan === "pro";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedTradeContext = useRef<string | null>(null);

  const chatOptions = {
    api: "/api/chat",
    body: { context: "dashboard" },
  } as any;

  const {
    messages = [],
    sendMessage,
    status
  } = useChat(chatOptions) as any;

  const [input, setInput] = useState("");
  const isLoading = status === 'submitted' || status === 'streaming';
  const append = sendMessage; // Map append to sendMessage

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e?: React.FormEvent | Event) => {
    e?.preventDefault?.();
    if (!input?.trim() || isLoading) return;
    sendMessage({ role: "user", content: input });
    setInput("");
  };

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Inject trade context into conversation
  useEffect(() => {
    if (tradeContext && tradeContext.id !== initializedTradeContext.current) {
      initializedTradeContext.current = tradeContext.id;
      append({
        role: "user",
        content: `I want to journal this trade: \${tradeContext.symbol} (\${tradeContext.side.toUpperCase()}). It was \${tradeContext.pnl && tradeContext.pnl > 0 ? "a winning trade" : "a losing trade"} with a realized PnL of $\${tradeContext.pnl}. Can you help me log my psychology?`
      });
    }
  }, [tradeContext, append]);

  if (!isPro) {
    return (
      <div className="flex h-full flex-col bg-card/20 select-none">
        {/* Header */}
        <div className="flex items-center gap-2 border-b border-border/40 px-4 py-3 bg-card/30 backdrop-blur-md sticky top-0 z-10">
          <Sparkles className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-semibold">AI Assistant</h3>
        </div>

        {/* Locked Content */}
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
          <div className="mb-6 relative">
             <div className="absolute inset-0 bg-yellow-500/20 blur-2xl rounded-full" />
             <Crown className="h-12 w-12 text-yellow-500 relative z-10" strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-bold mb-2">Pro Plan Required</h2>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
            Unlock professional AI analytics and journaling tools for your trading edge.
          </p>
          <div className="p-3 rounded-xl bg-card border border-border/60 text-xs text-muted-foreground/80 shadow-sm">
             Use <code className="text-foreground font-mono bg-muted px-1.5 py-0.5 rounded">/upgrade</code> in Telegram 
          </div>
        </div>

        {/* Input (Disabled) */}
        <div className="border-t border-border/40 p-4 bg-background/50">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none opacity-40">
               <Sparkles className="h-4 w-4 text-emerald-500" />
            </div>
            <Input
              disabled
              placeholder="Upgrade to chat..."
              className="flex-1 text-sm bg-secondary/20 border-border/40 pl-10 pr-10 rounded-xl cursor-not-allowed"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-background/50 relative overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-3 bg-card/40 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-500" />
          <h3 className="text-sm font-semibold">TradeLog AI</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide pb-24">
        {messages.length === 0 && !tradeContext && (
          <div className="bg-secondary/20 p-6 rounded-2xl text-sm text-center text-muted-foreground flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
               <BarChart2 className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
               <p className="font-semibold text-foreground">Analyzing Your Trading Edge</p>
               <p className="text-xs">Ask me about your win rate, Risk/Reward ratio, or journal your psychology for specific trades.</p>
            </div>
            <div className="w-full h-px bg-border/40" />
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">Ready to chat</p>
          </div>
        )}

        {/* Message Mapping */}
        {messages.map((m: any) => (
          <div key={m.id} className={cn("flex flex-col gap-2 animate-in fade-in duration-300", m.role === "user" ? "items-end" : "items-start")}>
            <div
              className={cn(
                "max-w-[90%] px-4 py-3 text-[14px] leading-relaxed",
                m.role === "user" 
                  ? "bg-primary text-primary-foreground rounded-2xl rounded-tr-none shadow-md" 
                  : "bg-card border border-border/50 rounded-2xl rounded-tl-none shadow-sm"
              )}
            >
              <span className="whitespace-pre-wrap">{m.content}</span>
              
              {/* Tool UI Rendering */}
              {m.toolInvocations?.map((toolInvocation: any) => {
                const toolCallId = toolInvocation.toolCallId;
                const isGetStats = toolInvocation.toolName === "getStats";
                const isJournal = toolInvocation.toolName === "journalTrade";
                
                if (isGetStats || isJournal) {
                  return (
                    <div key={toolCallId} className="mt-3 flex items-center gap-3 text-muted-foreground bg-secondary/40 px-3 py-2 rounded-xl text-xs border border-border/30">
                      {'result' in toolInvocation ? (
                        <>
                          {isGetStats ? <BarChart2 className="h-3.5 w-3.5 text-emerald-500" /> : <BookOpen className="h-3.5 w-3.5 text-amber-500" />}
                          <span className="font-medium">Data successfully processed.</span>
                        </>
                      ) : (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                          <span className="italic">Requesting engine synchronization...</span>
                        </>
                      )}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}

        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
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
              handleInputChange(e);
              e.target.style.height = "auto";
              e.target.style.height = `\${Math.min(e.target.scrollHeight, 140)}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                if (input?.trim() && !isLoading) {
                   const event = new Event("submit", { cancelable: true, bubbles: true });
                   e.currentTarget.form?.dispatchEvent(event);
                }
              }
            }}
            disabled={isLoading}
            placeholder="Talk to your AI..."
            className="flex-1 bg-transparent border-0 focus:ring-0 text-[14px] py-1.5 px-3 resize-none min-h-[38px] max-h-[140px] placeholder:text-muted-foreground/40 leading-relaxed ring-0 outline-none appearance-none"
            rows={1}
            autoFocus
          />
          <Button
            type="submit"
            disabled={isLoading || !input?.trim()}
            className="h-9 w-9 p-0 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20 active:scale-90 transition-all shrink-0"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
}
