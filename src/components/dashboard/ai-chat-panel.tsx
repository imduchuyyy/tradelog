"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  BarChart2,
  Database,
  Calculator,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useChat } from "@ai-sdk/react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface AIChatPanelProps {
  chatSessions?: any[];
  user?: any;
  tradeContext?: any;
}

// ─── Helpers for SDK v6 UIMessage ────────────────────────────────────────────

/** Extract concatenated text from a UIMessage's parts array */
function getMessageText(message: any): string {
  if (message.parts && Array.isArray(message.parts)) {
    return message.parts
      .filter((p: any) => p.type === "text")
      .map((p: any) => p.text || "")
      .join("");
  }
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
  tradeContext,
}: AIChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initializedTradeContext = useRef<string | null>(null);

  const {
    messages,
    sendMessage,
    status,
  } = useChat({
    api: "/api/chat",
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

  // Inject trade context (from dashboard "Analyze" buttons)
  useEffect(() => {
    if (tradeContext && tradeContext.id !== initializedTradeContext.current) {
      initializedTradeContext.current = tradeContext.id;
      sendMessage({
        text: `Analyze this trade: ${tradeContext.symbol} (${tradeContext.side?.toUpperCase()}), PnL: $${tradeContext.pnl}, Status: ${tradeContext.status}. What insights can you give me?`,
      });
    }
  }, [tradeContext, sendMessage]);

  const messageList = messages || [];

  return (
    <div className="flex h-full flex-col bg-background relative overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-hide pb-28">
        {/* Empty state */}
        {messageList.length === 0 && !tradeContext && (
          <div className="bg-card border border-border p-5 rounded-[6px] text-sm text-center text-muted-foreground flex flex-col items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
            <div className="h-11 w-11 rounded-[6px] border border-border bg-background flex items-center justify-center">
              <BarChart2 className="h-5 w-5 text-foreground" />
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-foreground text-sm">
                AI Trade Analytics
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Ask questions about your trading data. I can run SQL queries and
                compute advanced metrics for you.
              </p>
            </div>
            <div className="w-full space-y-1.5 mt-1">
              {[
                "What's my win rate by session?",
                "Show me my best performing setups",
                "Calculate my expectancy and profit factor",
                "What's my max drawdown?",
                "Analyze my performance on trending vs range markets",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => sendMessage({ text: suggestion })}
                  className="w-full text-left text-xs px-3 py-2 rounded-[4px] bg-background border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messageList.map((m: any) => {
          const text = getMessageText(m);
          const toolParts = getToolParts(m);

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
                    ? "bg-foreground text-background rounded-[6px] rounded-tr-none"
                    : "bg-card border border-border rounded-[6px] rounded-tl-none"
                )}
              >
                {text && m.role === "user" && (
                  <span className="whitespace-pre-wrap">{text}</span>
                )}
                {text && m.role !== "user" && (
                  <div className="prose-chat">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {text}
                    </ReactMarkdown>
                  </div>
                )}

                {/* Tool UI Rendering */}
                {toolParts.map((part: any) => {
                  const toolName = getToolName(part);
                  const done = hasToolOutput(part);

                  if (toolName === "queryTrades") {
                    const desc = part.input?.description || "Running query...";
                    const rowCount = done ? part.output?.rowCount : null;
                    return (
                      <div
                        key={part.toolCallId}
                        className="mt-3 flex items-center gap-2.5 text-muted-foreground bg-muted px-3 py-2 rounded-[4px] text-xs border border-border"
                      >
                        {done ? (
                          <>
                            <Database className="h-3.5 w-3.5 text-foreground" />
                            <span className="font-medium">
                              {desc} ({rowCount} row{rowCount !== 1 ? "s" : ""})
                            </span>
                          </>
                        ) : (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                            <span className="italic">{desc}</span>
                          </>
                        )}
                      </div>
                    );
                  }

                  if (toolName === "compute") {
                    const desc = part.input?.description || "Computing...";
                    return (
                      <div
                        key={part.toolCallId}
                        className="mt-3 flex items-center gap-2.5 text-muted-foreground bg-muted px-3 py-2 rounded-[4px] text-xs border border-border"
                      >
                        {done ? (
                          <>
                            <Calculator className="h-3.5 w-3.5 text-foreground" />
                            <span className="font-medium">{desc}</span>
                          </>
                        ) : (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                            <span className="italic">{desc}</span>
                          </>
                        )}
                      </div>
                    );
                  }

                  // Fallback for any unknown tool
                  return (
                    <div
                      key={part.toolCallId}
                      className="mt-3 flex items-center gap-2 text-muted-foreground text-xs"
                    >
                      {done ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
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
            <div className="rounded-[6px] rounded-tl-none bg-card border border-border px-4 py-3">
              <div className="flex gap-1.5 opacity-50">
                <span className="h-2 w-2 rounded-full bg-foreground animate-bounce [animation-delay:0ms]" />
                <span className="h-2 w-2 rounded-full bg-foreground animate-bounce [animation-delay:150ms]" />
                <span className="h-2 w-2 rounded-full bg-foreground animate-bounce [animation-delay:300ms]" />
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
          className="pointer-events-auto flex items-end gap-2 bg-card border border-border rounded-[6px] p-2 focus-within:border-[#333333] transition-all"
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
            placeholder="Ask about your trading data..."
            className="flex-1 bg-transparent border-0 focus:ring-0 text-[13px] py-1.5 px-3 resize-none min-h-[38px] max-h-[140px] placeholder:text-muted-foreground/40 leading-relaxed ring-0 outline-none appearance-none"
            rows={1}
            autoFocus
          />
          <Button
            type="submit"
            disabled={isLoading || !input?.trim()}
            className="h-9 w-9 p-0 rounded-[5px] bg-foreground text-background active:scale-90 transition-all shrink-0"
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
