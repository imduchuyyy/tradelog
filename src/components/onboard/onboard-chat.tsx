"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  BarChart3,
  Send,
  Sparkles,
  Loader2,
  Link2,
  Check,
  ArrowRight,
  Plus,
  Wrench,
} from "lucide-react";
import {
  onboardConnectExchange,
  onboardCreateSetup,
  completeOnboarding,
} from "@/app/actions/onboard";
import { cn } from "@/lib/utils";

// ─── Types ───────────────────────────────────────────────────────────────────

type Step =
  | "welcome"
  | "exchange_ask"
  | "exchange_form"
  | "exchange_done"
  | "setup_ask"
  | "setup_form"
  | "setup_done"
  | "finishing"
  | "complete";

interface Message {
  id: string;
  role: "assistant" | "user";
  content: string;
  component?: React.ReactNode;
}

interface OnboardChatProps {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
  locale: string;
}

const SETUP_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#f97316",
];

// ─── Component ───────────────────────────────────────────────────────────────

export function OnboardChat({ user, locale }: OnboardChatProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [step, setStep] = useState<Step>("welcome");
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [exchangeAdded, setExchangeAdded] = useState<string | null>(null);
  const [setupsAdded, setSetupsAdded] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasInitialized = useRef(false);

  const firstName = user.name?.split(" ")[0] || "Trader";

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Simulate typing delay for assistant messages
  const addAssistantMessage = useCallback(
    (content: string, component?: React.ReactNode, delay = 600) => {
      setIsTyping(true);
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          setMessages((prev) => [
            ...prev,
            {
              id: `assistant-${Date.now()}-${Math.random()}`,
              role: "assistant",
              content,
              component,
            },
          ]);
          setIsTyping(false);
          resolve();
        }, delay);
      });
    },
    []
  );

  const addUserMessage = useCallback((content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: "user",
        content,
      },
    ]);
  }, []);

  // ─── Step: Welcome ──────────────────────────────────────────────────────

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const runWelcome = async () => {
      await addAssistantMessage(
        `Hey ${firstName}! Welcome to TradeLog. I'm your AI trading assistant and I'll help you get set up in just a minute.`,
        undefined,
        800
      );
      await addAssistantMessage(
        "Let's start by connecting your exchange account so we can track your trades. Which exchange do you use?",
        undefined,
        1000
      );
      setStep("exchange_ask");
    };

    runWelcome();
  }, [firstName, addAssistantMessage]);

  // ─── Exchange Form (inline in chat) ─────────────────────────────────────

  function ExchangeForm() {
    const [loading, setLoading] = useState(false);
    const [exchangeName, setExchangeName] = useState("Binance");
    const [apiKey, setApiKey] = useState("");
    const [apiSecret, setApiSecret] = useState("");
    const [passphrase, setPassphrase] = useState("");

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
        setExchangeAdded(result.name);
        setStep("exchange_done");
      } catch {
        // Allow retry
        setLoading(false);
      }
    };

    return (
      <div className="space-y-3 pt-1">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Exchange</Label>
          <select
            value={exchangeName}
            onChange={(e) => setExchangeName(e.target.value)}
            className="flex h-8 w-full rounded-lg border border-border/60 bg-background/50 px-3 text-sm"
          >
            {[
              "Binance",
              "Bybit",
              "OKX",
              "Bitget",
              "KuCoin",
              "Coinbase",
              "Kraken",
              "dYdX",
            ].map((ex) => (
              <option key={ex} value={ex}>
                {ex}
              </option>
            ))}
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
        <p className="text-[11px] text-muted-foreground/70">
          We recommend read-only API keys. Your credentials are stored securely.
        </p>
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

  // ─── Setup Form (inline in chat) ────────────────────────────────────────

  function SetupForm() {
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [rules, setRules] = useState("");
    const [color, setColor] = useState(SETUP_COLORS[0]);

    const handleSubmit = async () => {
      if (!name.trim()) return;
      setLoading(true);
      try {
        const result = await onboardCreateSetup({
          name: name.trim(),
          description: description.trim() || undefined,
          rules: rules.trim() || undefined,
          color,
        });
        setSetupsAdded((prev) => [...prev, result.name]);
        setStep("setup_done");
      } catch {
        setLoading(false);
      }
    };

    return (
      <div className="space-y-3 pt-1">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Setup Name *</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. EMA Pullback, Breakout, Supply & Demand"
            className="h-8 text-sm bg-background/50 border-border/60"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Brief Description
          </Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this setup about?"
            className="h-8 text-sm bg-background/50 border-border/60"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">
            Entry Rules / Criteria
          </Label>
          <Textarea
            value={rules}
            onChange={(e) => setRules(e.target.value)}
            placeholder="When do you enter? What confirmations?"
            rows={2}
            className="text-sm bg-background/50 border-border/60 resize-none"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Color</Label>
          <div className="flex gap-1.5">
            {SETUP_COLORS.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={cn(
                  "h-6 w-6 rounded-full border-2 transition-all",
                  color === c
                    ? "border-foreground scale-110"
                    : "border-transparent"
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <Button
          onClick={handleSubmit}
          disabled={loading || !name.trim()}
          size="sm"
          className="w-full gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0"
        >
          {loading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Wrench className="h-3.5 w-3.5" />
          )}
          Create Setup
        </Button>
      </div>
    );
  }

  // ─── Step transitions ───────────────────────────────────────────────────

  // Exchange ask -> show form or skip
  const handleExchangeResponse = async (wantsExchange: boolean) => {
    if (wantsExchange) {
      addUserMessage("Yes, let me connect my exchange.");
      await addAssistantMessage(
        "Fill in your exchange API credentials below. Make sure to use read-only keys for security.",
        <ExchangeForm />,
        500
      );
      setStep("exchange_form");
    } else {
      addUserMessage("I'll skip this for now.");
      await addAssistantMessage(
        "No problem! You can always connect an exchange later from Settings.",
        undefined,
        500
      );
      await addAssistantMessage(
        "Now let's set up your first trading setup. Setups help you categorize and track the performance of different strategies. Would you like to create one?",
        undefined,
        800
      );
      setStep("setup_ask");
    }
  };

  // Exchange done -> move to setups
  useEffect(() => {
    if (step !== "exchange_done" || !exchangeAdded) return;

    const proceed = async () => {
      await addAssistantMessage(
        `${exchangeAdded} connected successfully! Your trades will be synced automatically.`,
        undefined,
        500
      );
      await addAssistantMessage(
        "Now let's set up your first trading strategy. Setups help you categorize trades and track which strategies perform best. Would you like to create one?",
        undefined,
        800
      );
      setStep("setup_ask");
    };

    proceed();
  }, [step, exchangeAdded, addAssistantMessage]);

  // Setup done -> ask for more or finish
  useEffect(() => {
    if (step !== "setup_done") return;

    const proceed = async () => {
      const lastSetup = setupsAdded[setupsAdded.length - 1];
      await addAssistantMessage(
        `"${lastSetup}" has been created! ${
          setupsAdded.length > 1
            ? `You now have ${setupsAdded.length} setups.`
            : ""
        } Would you like to add another setup, or are you ready to start trading?`,
        undefined,
        500
      );
      setStep("setup_ask");
    };

    proceed();
  }, [step, setupsAdded, addAssistantMessage]);

  // Setup ask -> show form or finish
  const handleSetupResponse = async (wantsSetup: boolean) => {
    if (wantsSetup) {
      addUserMessage(
        setupsAdded.length > 0
          ? "Yes, add another setup."
          : "Yes, let me create a setup."
      );
      await addAssistantMessage(
        "Tell me about your trading setup:",
        <SetupForm />,
        500
      );
      setStep("setup_form");
    } else {
      addUserMessage("I'm ready to go!");
      setStep("finishing");
    }
  };

  // Finishing -> complete onboarding
  useEffect(() => {
    if (step !== "finishing") return;

    const finish = async () => {
      const parts: string[] = [];
      if (exchangeAdded) parts.push(`connected **${exchangeAdded}**`);
      if (setupsAdded.length > 0)
        parts.push(
          `created **${setupsAdded.length}** setup${
            setupsAdded.length > 1 ? "s" : ""
          }`
        );

      const summary =
        parts.length > 0
          ? `You've ${parts.join(" and ")}. `
          : "";

      await addAssistantMessage(
        `${summary}You're all set! Your 3-day free trial is active with full access to AI analytics, PnL tracking, and more.\n\nLet's get you to your dashboard!`,
        undefined,
        800
      );

      // Mark onboarding complete
      await completeOnboarding();
      setStep("complete");

      // Redirect after a brief pause
      setTimeout(() => {
        router.push(`/${locale}/dashboard`);
      }, 1500);
    };

    finish();
  }, [step, exchangeAdded, setupsAdded, locale, router, addAssistantMessage]);

  // ─── Chat input handler (free text fallback) ───────────────────────────

  const handleSend = () => {
    if (!input.trim()) return;
    const text = input.trim().toLowerCase();
    addUserMessage(input.trim());
    setInput("");

    if (step === "exchange_ask") {
      if (
        text.includes("skip") ||
        text.includes("no") ||
        text.includes("later")
      ) {
        handleExchangeResponse(false);
      } else {
        handleExchangeResponse(true);
      }
    } else if (step === "setup_ask") {
      if (
        text.includes("skip") ||
        text.includes("no") ||
        text.includes("ready") ||
        text.includes("done") ||
        text.includes("finish")
      ) {
        handleSetupResponse(false);
      } else {
        handleSetupResponse(true);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border/40 bg-card/30 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-2.5 px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
            <BarChart3 className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">TradeLog</span>
          <div className="ml-auto">
            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-500">
              Setup
            </span>
          </div>
        </div>
      </header>

      {/* Chat area */}
      <div className="flex flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4">
          {/* Messages */}
          <div className="flex-1 space-y-4 py-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mt-0.5">
                    <Sparkles className="h-4 w-4 text-white" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/50 border border-border/40"
                  )}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {message.content.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                      if (part.startsWith("**") && part.endsWith("**")) {
                        return <strong key={i}>{part.slice(2, -2)}</strong>;
                      }
                      return <span key={i}>{part}</span>;
                    })}
                  </div>
                  {message.component && (
                    <div className="mt-3 border-t border-border/30 pt-3">
                      {message.component}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 mt-0.5">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div className="rounded-2xl bg-muted/50 border border-border/40 px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:0ms]" />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:150ms]" />
                    <span className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}

            {/* Quick action buttons (shown contextually) */}
            {!isTyping && step === "exchange_ask" && (
              <div className="flex gap-2 pl-11">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExchangeResponse(true)}
                  className="gap-2 border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Connect Exchange
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleExchangeResponse(false)}
                  className="text-muted-foreground"
                >
                  Skip for now
                </Button>
              </div>
            )}

            {!isTyping && step === "setup_ask" && (
              <div className="flex gap-2 pl-11">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSetupResponse(true)}
                  className="gap-2 border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
                >
                  {setupsAdded.length > 0 ? (
                    <>
                      <Plus className="h-3.5 w-3.5" />
                      Add Another Setup
                    </>
                  ) : (
                    <>
                      <Wrench className="h-3.5 w-3.5" />
                      Create Setup
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleSetupResponse(false)}
                  className="gap-2 text-muted-foreground"
                >
                  {setupsAdded.length > 0 ? (
                    <>
                      <ArrowRight className="h-3.5 w-3.5" />
                      Go to Dashboard
                    </>
                  ) : (
                    "Skip for now"
                  )}
                </Button>
              </div>
            )}

            {/* Redirecting indicator */}
            {step === "complete" && (
              <div className="flex items-center gap-2 pl-11 text-sm text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Redirecting to your dashboard...
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div className="sticky bottom-0 border-t border-border/40 bg-background/80 backdrop-blur-sm py-4">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={
                  step === "exchange_ask"
                    ? "Type 'yes' to connect or 'skip' to continue..."
                    : step === "setup_ask"
                    ? "Type 'yes' to add a setup or 'done' to finish..."
                    : step === "exchange_form" || step === "setup_form"
                    ? "Fill out the form above..."
                    : "Type a message..."
                }
                disabled={
                  isTyping ||
                  step === "exchange_form" ||
                  step === "setup_form" ||
                  step === "finishing" ||
                  step === "complete" ||
                  step === "welcome"
                }
                className="flex-1"
              />
              <Button
                onClick={handleSend}
                disabled={
                  !input.trim() ||
                  isTyping ||
                  step === "exchange_form" ||
                  step === "setup_form" ||
                  step === "finishing" ||
                  step === "complete" ||
                  step === "welcome"
                }
                className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white border-0 shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-center text-[11px] text-muted-foreground/60">
              You can always change these settings later from your dashboard
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
