"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  BarChart3,
  Send,
  Sparkles,
  Loader2,
  Link2,
  ArrowRight,
  CheckCircle2,
  Wrench,
  Zap,
  Shield,
} from "lucide-react";
import {
  onboardConnectExchange,
  completeOnboarding,
} from "@/app/actions/onboard";
import { cn } from "@/lib/utils";

/* eslint-disable @typescript-eslint/no-explicit-any */

interface OnboardChatProps {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  locale: string;
}

function ExchangeForm({
  suggestedName,
  onComplete,
}: {
  suggestedName?: string;
  onComplete: (res: any) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [exchangeName, setExchangeName] = useState(suggestedName || "Binance");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [passphrase, setPassphrase] = useState("");
  const [done, setDone] = useState(false);

  const needsPassphrase = ["OKX", "KuCoin"].includes(exchangeName);

  const handleSubmit = async () => {
    if (!apiKey.trim() || !apiSecret.trim()) return;
    setLoading(true);
    try {
      const result = await onboardConnectExchange({
        name: exchangeName,
        apiKey: apiKey.trim(),
        apiSecret: apiSecret.trim(),
        passphrase: needsPassphrase ? passphrase.trim() : undefined,
      });
      setDone(true);
      onComplete({ success: true, exchange: result.name });
    } catch (e: any) {
      setLoading(false);
      onComplete({ success: false, error: e.message });
    }
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 text-green-500 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20 mt-2">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-sm font-medium">
          Successfully Connected to {exchangeName}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-3 mt-2 border-t border-border/30">
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Exchange</Label>
        <select
          value={exchangeName}
          onChange={(e) => setExchangeName(e.target.value)}
          className="flex h-8 w-full rounded-lg border border-border/60 bg-background/50 px-3 text-sm"
        >
          {["Binance", "Bybit", "OKX", "Bitget", "KuCoin", "Coinbase", "Kraken", "dYdX"].map(
            (ex) => (
              <option key={ex} value={ex}>
                {ex}
              </option>
            )
          )}
        </select>
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">API Key</Label>
        <Input
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          type="password"
          placeholder="Paste your API key"
          className="h-8 text-sm bg-background/50 border-border/60"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">API Secret</Label>
        <Input
          value={apiSecret}
          onChange={(e) => setApiSecret(e.target.value)}
          type="password"
          placeholder="Paste your API secret"
          className="h-8 text-sm bg-background/50 border-border/60"
        />
      </div>
      {needsPassphrase && (
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Passphrase</Label>
          <Input
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            type="password"
            placeholder="API passphrase"
            className="h-8 text-sm bg-background/50 border-border/60"
          />
        </div>
      )}
      <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-2">
        <p className="text-[11px] text-yellow-600 dark:text-yellow-400 flex items-center gap-1.5">
          <Shield className="h-3 w-3" />
          We recommend read-only API keys. Your credentials are encrypted.
        </p>
      </div>
      <Button
        onClick={handleSubmit}
        disabled={loading || !apiKey.trim() || !apiSecret.trim()}
        size="sm"
        className="w-full gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0"
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Link2 className="h-3.5 w-3.5" />
        )}
        Connect {exchangeName}
      </Button>
    </div>
  );
}

// Helper to extract text content from message parts (SDK v6: parts first)
function getMessageText(message: any): string {
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

// Helper to extract tool invocations from message parts (SDK v6)
function getToolInvocations(message: any): any[] {
  if (!message.parts || !Array.isArray(message.parts)) return [];
  return message.parts
    .filter((p: any) => p.type?.startsWith("tool-") || p.type === "dynamic-tool")
    .map((p: any) => ({
      toolCallId: p.toolCallId,
      toolName: p.type === "dynamic-tool" ? p.toolName : p.type?.replace("tool-", ""),
      input: p.input ?? {},
      output: p.output,
      state: p.state,
    }));
}

export function OnboardChat({ user, locale }: OnboardChatProps) {
  const router = useRouter();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [finishing, setFinishing] = useState(false);

  const chatOptions: any = {
    api: "/api/chat",
    body: { context: "onboarding" },
  };

  const {
    messages = [],
    addToolResult,
    sendMessage,
    status,
  } = useChat(chatOptions) as any;

  const [input, setInput] = useState("");
  const isLoading = status === "submitted" || status === "streaming";

  const handleInputChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>
  ) => {
    setInput(e.target.value);
  };

  const handleSubmit = (e?: React.FormEvent | Event) => {
    e?.preventDefault?.();
    if (!input?.trim() || isLoading) return;
    sendMessage({ text: input });
    setInput("");
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleFinish = async () => {
    setFinishing(true);
    await completeOnboarding();
    router.push(`/${locale}/dashboard`);
  };

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden font-sans">
      {/* Header */}
      <header className="shrink-0 border-b border-border/40 bg-card/30 backdrop-blur-sm z-30">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2.5 px-4 justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
              TradeLog
            </span>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleFinish}
            disabled={finishing}
            className="gap-2 text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            {finishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">Finish Setup</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative overflow-hidden flex flex-col">
        {/* Messages scroll area */}
        <div className="flex-1 overflow-y-auto pt-8 pb-40 px-4 scrollbar-hide">
          <div className="mx-auto max-w-3xl space-y-8">
            {/* Welcome Message (Static) */}
            {messages.length === 0 && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex gap-4 justify-start">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div className="max-w-[85%] rounded-3xl rounded-tl-none px-5 py-3.5 text-[15px] leading-relaxed bg-secondary/40 border border-border/40 shadow-sm">
                    <p className="font-semibold text-foreground mb-2">
                      Welcome to TradeLog, {user.name?.split(" ")[0] || "Trader"}!
                    </p>
                    <p className="text-muted-foreground mb-3">
                      I&apos;m your AI trading coach. Let me help you set up your
                      trading journal in a few simple steps.
                    </p>
                    <p className="text-muted-foreground">
                      First, let&apos;s talk about your trading style. Tell me about
                      the
                      <span className="text-foreground font-medium">
                        {" "}
                        market conditions
                      </span>{" "}
                      you usually look for before entering a trade. For example:
                    </p>
                    <div className="mt-3 space-y-1.5">
                      {[
                        "H4 timeframe showing bullish trend",
                        "Liquidity swept below a key level",
                        "RSI divergence on the 15m chart",
                        "Break of structure confirmed",
                      ].map((example) => (
                        <div
                          key={example}
                          className="flex items-center gap-2 text-sm text-muted-foreground"
                        >
                          <Zap className="h-3 w-3 text-blue-500 shrink-0" />
                          <span>{example}</span>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-sm text-muted-foreground/70 italic">
                      Just describe how you trade and I&apos;ll extract the conditions
                      for you.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((m: any) => {
              const text = getMessageText(m);
              const tools = getToolInvocations(m);

              return (
                <div
                  key={m.id}
                  className={cn(
                    "flex gap-4 animate-in fade-in duration-300",
                    m.role === "user" ? "justify-end" : "justify-start"
                  )}
                >
                  {m.role === "assistant" && (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "max-w-[85%] px-5 py-3.5 text-[15px] leading-relaxed shadow-sm transition-all",
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-3xl rounded-tr-none"
                        : "bg-secondary/40 border border-border/40 rounded-3xl rounded-tl-none"
                    )}
                  >
                    {text && <span className="whitespace-pre-wrap">{text}</span>}

                    {/* Tool invocations */}
                    {tools.map((toolInv: any) => {
                      const toolCallId = toolInv.toolCallId;
                      const hasResult = toolInv.output !== undefined || toolInv.state === "output-available";

                      if (toolInv.toolName === "connectExchange") {
                        return (
                          <div
                            key={toolCallId}
                            className="mt-4 p-4 bg-background/40 rounded-2xl border border-border/30"
                          >
                            {hasResult ? (
                              <div className="flex items-center gap-2 text-green-500 font-medium py-1">
                                <CheckCircle2 className="h-5 w-5" />
                                <span className="text-sm">
                                  Exchange connection synced.
                                </span>
                              </div>
                            ) : (
                              <ExchangeForm
                                suggestedName={
                                  toolInv.input?.exchangeNameSuggestion
                                }
                                onComplete={(res: any) =>
                                  addToolResult({
                                    toolCallId,
                                    result: res,
                                  })
                                }
                              />
                            )}
                          </div>
                        );
                      }

                      if (toolInv.toolName === "createMarketConditions") {
                        return (
                          <div
                            key={toolCallId}
                            className="mt-4 p-3 bg-blue-500/5 rounded-xl border border-blue-500/20"
                          >
                            {hasResult ? (
                              <div className="space-y-2">
                                <div className="flex items-center gap-2 text-blue-500 font-medium">
                                  <Zap className="h-4 w-4" />
                                  <span className="text-sm">
                                    Market Conditions Saved
                                  </span>
                                </div>
                                {toolInv.output?.created?.length > 0 && (
                                  <div className="flex flex-wrap gap-1.5 mt-1">
                                    {toolInv.output.created.map((c: string) => (
                                      <span
                                        key={c}
                                        className="text-xs bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-full px-2.5 py-0.5"
                                      >
                                        {c}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                                <span className="text-sm italic">
                                  Saving market conditions...
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      }

                      if (toolInv.toolName === "createSetup") {
                        return (
                          <div
                            key={toolCallId}
                            className="mt-4 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/20"
                          >
                            {hasResult ? (
                              <div className="flex items-center gap-2 text-emerald-500 font-medium">
                                <Wrench className="h-4 w-4" />
                                <span className="text-sm">
                                  Strategy Created:{" "}
                                  {toolInv.output?.setupName ||
                                    toolInv.input?.setupName}
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin text-emerald-500" />
                                <span className="text-sm italic">
                                  Building strategy...
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      }

                      return (
                        <div
                          key={toolCallId}
                          className="mt-3 flex items-center gap-2 text-muted-foreground text-xs"
                        >
                          {hasResult ? (
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

            {isLoading &&
              messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div className="rounded-3xl rounded-tl-none bg-secondary/40 border border-border/40 px-5 py-4">
                    <div className="flex gap-1.5 mt-1">
                      <span className="h-2 w-2 rounded-full bg-blue-500/40 animate-bounce [animation-delay:0ms]" />
                      <span className="h-2 w-2 rounded-full bg-blue-500/40 animate-bounce [animation-delay:150ms]" />
                      <span className="h-2 w-2 rounded-full bg-blue-500/40 animate-bounce [animation-delay:300ms]" />
                    </div>
                  </div>
                </div>
              )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Fixed Input Area */}
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 bg-gradient-to-t from-background via-background to-transparent z-40 pointer-events-none">
          <div className="mx-auto max-w-3xl pointer-events-auto">
            <form
              onSubmit={handleSubmit}
              className="group relative flex items-end gap-3 bg-card border border-border/80 rounded-[2rem] p-3 pl-5 shadow-2xl focus-within:border-blue-500/50 focus-within:ring-4 focus-within:ring-blue-500/10 transition-all duration-300"
            >
              <textarea
                value={input || ""}
                onChange={(e) => {
                  handleInputChange(e);
                  e.target.style.height = "auto";
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`;
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
                placeholder="Describe your trading style and market conditions..."
                className="flex-1 bg-transparent border-0 focus:ring-0 text-[16px] py-3 px-0 resize-none min-h-[52px] max-h-[160px] placeholder:text-muted-foreground/40 transition-all leading-relaxed appearance-none ring-0 outline-none"
                disabled={isLoading}
                rows={1}
                autoFocus
              />
              <Button
                type="submit"
                disabled={!input?.trim() || isLoading}
                className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all shrink-0 active:scale-90"
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Send className="h-5 w-5" />
                )}
              </Button>
            </form>
            <p className="mt-4 text-center text-[11px] text-muted-foreground/30 font-medium tracking-widest uppercase">
              Encrypted Bridge &bull; AI Powered Insights
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
